// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import { ONFT721 } from "@layerzerolabs/onft-evm/contracts/onft721/ONFT721.sol";
import { SendParam } from "@layerzerolabs/onft-evm/contracts/onft721/interfaces/IONFT721.sol";
import { Origin } from "@layerzerolabs/lz-evm-protocol-v2/contracts/interfaces/ILayerZeroEndpointV2.sol";
import { IOAppMsgInspector } from "@layerzerolabs/oapp-evm/contracts/oapp/interfaces/IOAppMsgInspector.sol";
import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { ERC2981 } from "@openzeppelin/contracts/token/common/ERC2981.sol";
import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";
import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";
import "./libraries/Errors.sol";
import "./libraries/Types.sol";

/**
 * @title RWA721ONFTV2
 * @notice ERC-721 NFT for Real World Assets with LayerZero ONFT v2 bridging
 * @dev Built on LayerZero V2 ONFT721 standard with metadata preservation
 */
contract RWA721ONFTV2 is ONFT721, ERC2981, Pausable {
    using Strings for uint256;

    uint32 public immutable ORIGIN_CHAIN_ID;
    uint256 private _nextTokenId;

    /// @notice Multiplier for encoding chain ID into token IDs
    /// @dev Allows 1 billion tokens per chain (token IDs: chainId * 1B + localId)
    uint256 private constant CHAIN_ID_MULTIPLIER = 1_000_000_000;

    mapping(uint256 => Types.BridgeInfo) public bridgeInfo;
    mapping(uint256 => string) private _tokenURIs;

    event Minted(address indexed to, uint256 indexed tokenId, string uri);

    /**
     * @dev Constructor for RWA721ONFTV2
     * @param name Name of the NFT collection
     * @param symbol Symbol of the NFT collection
     * @param lzEndpoint LayerZero V2 endpoint address
     * @param delegate Address that can configure the OApp
     * @param originChainId LayerZero chain ID where contract is deployed
     */
    constructor(
        string memory name,
        string memory symbol,
        address lzEndpoint,
        address delegate,
        uint32 originChainId
    ) ONFT721(name, symbol, lzEndpoint, delegate) {
        ORIGIN_CHAIN_ID = originChainId;
        _nextTokenId = 1;
    }

    /**
     * @notice Mint a new RWA NFT with metadata
     * @param to Recipient address
     * @param uri IPFS URI for token metadata
     * @return tokenId The ID of the newly minted token (chain-encoded)
     */
    function mint(address to, string calldata uri)
        external
        whenNotPaused
        returns (uint256)
    {
        if (to == address(0)) revert Errors.InvalidAddress();

        // Get local token ID and increment counter
        uint256 localTokenId = _nextTokenId++;

        // Encode chain ID into global token ID to prevent cross-chain collisions
        // Format: (chainId * 1_000_000_000) + localTokenId
        uint256 globalTokenId = (uint256(ORIGIN_CHAIN_ID) * CHAIN_ID_MULTIPLIER) + localTokenId;

        _safeMint(to, globalTokenId);
        _tokenURIs[globalTokenId] = uri;

        bridgeInfo[globalTokenId] = Types.BridgeInfo({
            originChainId: ORIGIN_CHAIN_ID,
            isBridged: false,
            bridgeCount: 0
        });

        emit Minted(to, globalTokenId, uri);
        return globalTokenId;
    }

    /**
     * @notice Get the next token ID that will be minted (chain-encoded)
     * @return The next global token ID
     */
    function nextTokenId() external view returns (uint256) {
        return (uint256(ORIGIN_CHAIN_ID) * CHAIN_ID_MULTIPLIER) + _nextTokenId;
    }

    /**
     * @notice Get the next local token ID (not chain-encoded)
     * @return The next local token ID counter value
     */
    function nextLocalTokenId() external view returns (uint256) {
        return _nextTokenId;
    }

    /**
     * @dev Override _debit to burn token and track bridge info
     * @param from Address sending the token
     * @param tokenId Token ID being sent
     * @param dstEid Destination endpoint ID
     */
    function _debit(
        address from,
        uint256 tokenId,
        uint32 dstEid
    ) internal virtual override whenNotPaused {
        if (from != ownerOf(tokenId)) revert Errors.Unauthorized();

        // Bridge info is updated
        bridgeInfo[tokenId].isBridged = true;
        bridgeInfo[tokenId].bridgeCount++;

        // Burn token (tokenURI stays in _tokenURIs mapping for encoding)
        _burn(tokenId);
    }

    /**
     * @dev Override _credit to mint token and restore URI from extraData
     * @param to Address receiving the token
     * @param tokenId Token ID being received (already chain-encoded)
     * @param srcEid Source endpoint ID
     */
    function _credit(
        address to,
        uint256 tokenId,
        uint32 srcEid
    ) internal virtual override {
        // Mint the token
        _safeMint(to, tokenId);

        // Extract chain ID and local ID from the global token ID
        uint32 tokenOriginChain = uint32(tokenId / CHAIN_ID_MULTIPLIER);
        uint256 localTokenId = tokenId % CHAIN_ID_MULTIPLIER;

        // Only update _nextTokenId if this token was originally minted on this chain
        // and the local ID would collide with our counter
        if (tokenOriginChain == ORIGIN_CHAIN_ID && localTokenId >= _nextTokenId) {
            _nextTokenId = localTokenId + 1;
        }

        // Initialize bridge info if this is first time seeing this token
        if (bridgeInfo[tokenId].originChainId == 0) {
            bridgeInfo[tokenId].originChainId = srcEid;
        }

        bridgeInfo[tokenId].isBridged = true;
        bridgeInfo[tokenId].bridgeCount++;

        // Note: tokenURI is set in _lzReceive after decoding the message
    }

    /**
     * @dev Override to build custom message with tokenURI included
     */
    function _buildMsgAndOptions(
        SendParam calldata _sendParam
    ) internal view virtual override returns (bytes memory message, bytes memory options) {
        // Encode: to (bytes32) + tokenId (uint256) + tokenURI (string)
        string memory uri = _tokenURIs[_sendParam.tokenId];
        message = abi.encode(_sendParam.to, _sendParam.tokenId, uri);

        // Use SEND message type (1)
        options = combineOptions(_sendParam.dstEid, SEND, _sendParam.extraOptions);

        // Inspect if inspector is set
        address inspector = msgInspector;
        if (inspector != address(0)) IOAppMsgInspector(inspector).inspect(message, options);
    }

    /**
     * @dev Override to decode custom message with tokenURI
     */
    function _lzReceive(
        Origin calldata _origin,
        bytes32 _guid,
        bytes calldata _message,
        address _executor,
        bytes calldata _extraData
    ) internal virtual override {
        // Decode: to (bytes32) + tokenId (uint256) + tokenURI (string)
        (bytes32 toBytes32, uint256 tokenId, string memory uri) = abi.decode(
            _message,
            (bytes32, uint256, string)
        );

        address toAddress = bytes32ToAddress(toBytes32);

        // Credit the token (mints it)
        _credit(toAddress, tokenId, _origin.srcEid);

        // Set the tokenURI after minting
        _tokenURIs[tokenId] = uri;

        emit ONFTReceived(_guid, _origin.srcEid, toAddress, tokenId);
    }

    /**
     * @dev Helper to convert bytes32 to address
     */
    function bytes32ToAddress(bytes32 _b) internal pure returns (address) {
        return address(uint160(uint256(_b)));
    }

    /**
     * @notice Get the token URI for a given token ID
     * @param tokenId Token ID to query
     * @return Token URI string
     */
    function tokenURI(uint256 tokenId)
        public
        view
        virtual
        override
        returns (string memory)
    {
        _requireOwned(tokenId);

        string memory _tokenURI = _tokenURIs[tokenId];
        string memory base = _baseURI();

        // If there is no base URI, return the token URI.
        if (bytes(base).length == 0) {
            return _tokenURI;
        }
        // If both are set, concatenate the baseURI and tokenURI (via string.concat).
        if (bytes(_tokenURI).length > 0) {
            return string.concat(base, _tokenURI);
        }

        return super.tokenURI(tokenId);
    }

    /**
     * @notice Extract the origin chain EID from a token ID
     * @param tokenId The global token ID
     * @return The LayerZero chain EID where this token was originally minted
     */
    function getOriginChainEid(uint256 tokenId) public pure returns (uint32) {
        return uint32(tokenId / CHAIN_ID_MULTIPLIER);
    }

    /**
     * @notice Extract the local token ID from a global token ID
     * @param tokenId The global token ID
     * @return The local token number on its origin chain
     */
    function getLocalTokenId(uint256 tokenId) public pure returns (uint256) {
        return tokenId % CHAIN_ID_MULTIPLIER;
    }

    /**
     * @notice Check if a token was originally minted on this chain
     * @param tokenId The global token ID
     * @return True if token was minted on this chain
     */
    function isNativeToken(uint256 tokenId) public view returns (bool) {
        return getOriginChainEid(tokenId) == ORIGIN_CHAIN_ID;
    }

    /**
     * @notice Pause contract operations
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause contract operations
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Set default royalty for all tokens
     * @param receiver Royalty recipient address
     * @param feeNumerator Royalty fee in basis points
     */
    function setDefaultRoyalty(address receiver, uint96 feeNumerator)
        external
        onlyOwner
    {
        _setDefaultRoyalty(receiver, feeNumerator);
    }

    /**
     * @dev Override supportsInterface for ERC2981 royalty standard
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721, ERC2981)
        returns (bool)
    {
        return ERC721.supportsInterface(interfaceId) || ERC2981.supportsInterface(interfaceId);
    }

    /**
     * @dev Override _update to handle pausable
     */
    function _update(address to, uint256 tokenId, address auth)
        internal
        virtual
        override
        whenNotPaused
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }
}
