// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IERC20.sol";
import "./interfaces/IPermit2.sol";
import "./interfaces/ICCTPScaffold.sol";
import "./libraries/Errors.sol";
import "./libraries/Types.sol";
import "./Config.sol";

/**
 * @title Marketplace
 * @notice Fixed-price NFT marketplace with USDC payments via Permit2
 * @dev Supports same-chain purchases and scaffolded cross-chain via CCTP
 */
contract Marketplace is ReentrancyGuard, Pausable, Ownable {
    IERC20 public immutable usdc;
    IPermit2 public immutable permit2;
    uint256 public immutable platformFeeBps;
    address public immutable feeRecipient;

    uint256 private _nextListingId;
    mapping(uint256 => Types.Listing) public listings;

    event Listed(
        uint256 indexed listingId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        uint256 price
    );
    event Canceled(uint256 indexed listingId);
    event Bought(
        uint256 indexed listingId,
        address indexed buyer,
        address indexed seller,
        uint256 price,
        uint256 platformFee
    );
    event BoughtCrossChain(
        uint256 indexed listingId,
        address indexed buyer,
        uint16 indexed dstChainId,
        uint256 price
    );

    constructor(
        address _usdc,
        address _permit2,
        address _feeRecipient,
        uint256 _platformFeeBps
    ) Ownable(msg.sender) {
        if (_usdc == address(0) || _permit2 == address(0) || _feeRecipient == address(0)) {
            revert Errors.InvalidAddress();
        }
        if (_platformFeeBps > Config.MAX_PLATFORM_FEE_BPS) {
            revert Errors.InvalidFee();
        }

        usdc = IERC20(_usdc);
        permit2 = IPermit2(_permit2);
        feeRecipient = _feeRecipient;
        platformFeeBps = _platformFeeBps;
        _nextListingId = 1;
    }

    function createListing(
        address nftContract,
        uint256 tokenId,
        uint256 price
    ) external whenNotPaused returns (uint256) {
        if (nftContract == address(0)) revert Errors.InvalidAddress();
        if (price == 0) revert Errors.InvalidPrice();

        IERC721 nft = IERC721(nftContract);
        if (nft.ownerOf(tokenId) != msg.sender) revert Errors.TokenNotOwned();
        if (
            nft.getApproved(tokenId) != address(this) &&
            !nft.isApprovedForAll(msg.sender, address(this))
        ) {
            revert Errors.NotApprovedForTransfer();
        }

        uint256 listingId = _nextListingId++;
        listings[listingId] = Types.Listing({
            nftContract: nftContract,
            tokenId: tokenId,
            seller: msg.sender,
            price: price,
            active: true
        });

        emit Listed(listingId, nftContract, tokenId, msg.sender, price);
        return listingId;
    }

    function cancelListing(uint256 listingId) external {
        Types.Listing storage listing = listings[listingId];
        if (!listing.active) revert Errors.ListingNotActive();
        if (listing.seller != msg.sender) revert Errors.NotListingSeller();

        listing.active = false;
        emit Canceled(listingId);
    }

    function buy(
        uint256 listingId,
        address recipient,
        IPermit2.PermitTransferFrom calldata permit,
        IPermit2.SignatureTransferDetails calldata transferDetails,
        bytes calldata signature
    ) external nonReentrant whenNotPaused {
        Types.Listing storage listing = listings[listingId];
        if (!listing.active) revert Errors.ListingNotActive();
        if (recipient == address(0)) revert Errors.InvalidRecipient();

        if (permit.permitted.token != address(usdc)) {
            revert Errors.InvalidCurrency();
        }
        if (transferDetails.requestedAmount < listing.price) {
            revert Errors.InvalidAmount();
        }

        listing.active = false;

        uint256 platformFee = (listing.price * platformFeeBps) / Config.BPS_DENOMINATOR;
        uint256 sellerProceeds = listing.price - platformFee;

        permit2.permitTransferFrom(
            permit,
            IPermit2.SignatureTransferDetails({
                to: address(this),
                requestedAmount: listing.price
            }),
            msg.sender,
            signature
        );

        if (platformFee > 0) {
            bool feeSuccess = usdc.transfer(feeRecipient, platformFee);
            if (!feeSuccess) revert Errors.TransferFailed();
        }

        bool sellerSuccess = usdc.transfer(listing.seller, sellerProceeds);
        if (!sellerSuccess) revert Errors.TransferFailed();

        IERC721(listing.nftContract).safeTransferFrom(
            listing.seller,
            recipient,
            listing.tokenId
        );

        emit Bought(listingId, msg.sender, listing.seller, listing.price, platformFee);
    }

    /**
     * @notice Cross-chain purchase via CCTP (scaffold implementation)
     * @dev TODO: Integrate Circle CCTP SDK for production
     *
     * Flow:
     * 1. Buyer calls this on source chain with USDC
     * 2. Contract burns USDC via CCTP TokenMessenger.depositForBurn()
     * 3. Circle attestation service signs the burn
     * 4. Relayer (or buyer) submits attestation to destination chain
     * 5. CCTP mints USDC on destination, triggers marketplace settlement
     * 6. NFT transferred to buyer on destination chain
     *
     * Requires:
     * - CCTP TokenMessenger contract integration
     * - Attestation fetching from Circle API
     * - Cross-chain message passing for listing resolution
     */
    function buyCrossChain(
        uint256 listingId,
        address recipient,
        uint16 dstChainId,
        IPermit2.PermitTransferFrom calldata permit,
        bytes calldata signature,
        address cctpTokenMessenger
    ) external nonReentrant whenNotPaused {
        Types.Listing storage listing = listings[listingId];
        if (!listing.active) revert Errors.ListingNotActive();
        if (recipient == address(0)) revert Errors.InvalidRecipient();

        permit2.permitTransferFrom(
            permit,
            IPermit2.SignatureTransferDetails({
                to: address(this),
                requestedAmount: listing.price
            }),
            msg.sender,
            signature
        );

        listing.active = false;

        emit BoughtCrossChain(listingId, msg.sender, dstChainId, listing.price);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function getListing(uint256 listingId)
        external
        view
        returns (Types.Listing memory)
    {
        return listings[listingId];
    }
}
