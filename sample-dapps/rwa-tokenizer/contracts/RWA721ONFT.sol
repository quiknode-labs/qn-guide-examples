// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./interfaces/IONFT721.sol";
import "./interfaces/ILayerZeroEndpoint.sol";
import "./libraries/Errors.sol";
import "./libraries/Types.sol";

/**
 * @title RWA721ONFT
 * @notice ERC-721 NFT for Real World Assets with LayerZero ONFT v2 bridging
 * @dev Supports cross-chain transfers via LayerZero while preserving metadata
 */
contract RWA721ONFT is ERC721, ERC721URIStorage, ERC2981, Ownable, Pausable {
    ILayerZeroEndpoint public immutable lzEndpoint;
    uint32 public immutable originChainId;

    uint256 private _nextTokenId;
    mapping(uint256 => Types.BridgeInfo) public bridgeInfo;
    mapping(uint32 => bytes) public trustedRemoteLookup;

    event Minted(address indexed to, uint256 indexed tokenId, string uri);
    event BridgeSent(
        uint32 indexed dstChainId,
        address indexed from,
        address indexed to,
        uint256 tokenId
    );
    event BridgeReceived(
        uint32 indexed srcChainId,
        address indexed to,
        uint256 tokenId
    );
    event SetTrustedRemote(uint32 indexed chainId, bytes remoteAddress);

    constructor(
        string memory name,
        string memory symbol,
        address _lzEndpoint,
        uint32 _originChainId
    ) ERC721(name, symbol) Ownable(msg.sender) {
        if (_lzEndpoint == address(0)) revert Errors.InvalidAddress();
        lzEndpoint = ILayerZeroEndpoint(_lzEndpoint);
        originChainId = _originChainId;
        _nextTokenId = 1;
    }

    function mint(address to, string calldata uri)
        external
        whenNotPaused
        returns (uint256)
    {
        if (to == address(0)) revert Errors.InvalidAddress();

        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);

        bridgeInfo[tokenId] = Types.BridgeInfo({
            originChainId: originChainId,
            isBridged: false,
            bridgeCount: 0
        });

        emit Minted(to, tokenId, uri);
        return tokenId;
    }

    function sendFrom(
        address from,
        uint32 dstChainId,
        bytes calldata toAddress,
        uint256 tokenId,
        address payable refundAddress,
        address zroPaymentAddress,
        bytes calldata adapterParams
    ) external payable whenNotPaused {
        if (!_isAuthorized(ownerOf(tokenId), msg.sender, tokenId)) {
            revert Errors.Unauthorized();
        }
        if (trustedRemoteLookup[dstChainId].length == 0) {
            revert Errors.InvalidChainId();
        }

        string memory uri = tokenURI(tokenId);

        _burn(tokenId);

        bridgeInfo[tokenId].isBridged = true;
        bridgeInfo[tokenId].bridgeCount++;

        bytes memory payload = abi.encode(toAddress, tokenId, uri);

        lzEndpoint.send{value: msg.value}(
            dstChainId,
            trustedRemoteLookup[dstChainId],
            payload,
            refundAddress,
            zroPaymentAddress,
            adapterParams
        );

        emit BridgeSent(dstChainId, from, _bytesToAddress(toAddress), tokenId);
    }

    function lzReceive(
        uint32 srcChainId,
        bytes calldata srcAddress,
        uint64,
        bytes calldata payload
    ) external {
        if (msg.sender != address(lzEndpoint)) revert Errors.Unauthorized();
        if (
            keccak256(trustedRemoteLookup[srcChainId]) != keccak256(srcAddress)
        ) {
            revert Errors.Unauthorized();
        }

        (bytes memory toAddressBytes, uint256 tokenId, string memory uri) =
            abi.decode(payload, (bytes, uint256, string));
        address toAddress = _bytesToAddress(toAddressBytes);

        if (!_exists(tokenId)) {
            _safeMint(toAddress, tokenId);
            _setTokenURI(tokenId, uri);
            if (bridgeInfo[tokenId].originChainId == 0) {
                bridgeInfo[tokenId].originChainId = srcChainId;
            }
        } else {
            _safeMint(toAddress, tokenId);
        }

        bridgeInfo[tokenId].isBridged = true;
        bridgeInfo[tokenId].bridgeCount++;

        emit BridgeReceived(srcChainId, toAddress, tokenId);
    }

    function estimateSendFee(
        uint32 dstChainId,
        bytes calldata toAddress,
        uint256 tokenId,
        bool useZro,
        bytes calldata adapterParams
    ) external view returns (uint256 nativeFee, uint256 zroFee) {
        string memory uri = "";
        if (_exists(tokenId)) {
            uri = tokenURI(tokenId);
        }
        bytes memory payload = abi.encode(toAddress, tokenId, uri);
        return lzEndpoint.estimateFees(
            dstChainId,
            address(this),
            payload,
            useZro,
            adapterParams
        );
    }

    function setTrustedRemote(uint32 _srcChainId, bytes calldata _srcAddress)
        external
        onlyOwner
    {
        trustedRemoteLookup[_srcChainId] = _srcAddress;
        emit SetTrustedRemote(_srcChainId, _srcAddress);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function setDefaultRoyalty(address receiver, uint96 feeNumerator)
        external
        onlyOwner
    {
        _setDefaultRoyalty(receiver, feeNumerator);
    }

    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    function _bytesToAddress(bytes memory _bytes)
        internal
        pure
        returns (address)
    {
        require(_bytes.length >= 20, "Invalid address bytes");
        address tempAddress;
        assembly {
            tempAddress := mload(add(_bytes, 20))
        }
        return tempAddress;
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
