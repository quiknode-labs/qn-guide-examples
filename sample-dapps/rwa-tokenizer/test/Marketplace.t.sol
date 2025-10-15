// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Test.sol";
import "../contracts/Marketplace.sol";
import "../contracts/RWA721ONFT.sol";
import "../contracts/Config.sol";
import "../contracts/interfaces/IPermit2.sol";
import "../contracts/interfaces/IERC20.sol";

contract MockERC20 is IERC20 {
    mapping(address => uint256) public override balanceOf;
    mapping(address => mapping(address => uint256)) public override allowance;
    uint256 public override totalSupply;

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        totalSupply += amount;
    }

    function transfer(address to, uint256 amount) external override returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount)
        external
        override
        returns (bool)
    {
        if (allowance[from][msg.sender] != type(uint256).max) {
            allowance[from][msg.sender] -= amount;
        }
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external override returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }
}

contract MockPermit2 is IPermit2 {
    function permitTransferFrom(
        PermitTransferFrom calldata permit,
        SignatureTransferDetails calldata transferDetails,
        address owner,
        bytes calldata
    ) external override {
        IERC20(permit.permitted.token).transferFrom(
            owner,
            transferDetails.to,
            transferDetails.requestedAmount
        );
    }

    function permit(address, PermitSingle calldata, bytes calldata) external pure override {
        revert("Not implemented");
    }
}

contract MockLayerZeroEndpoint {
    function send(uint32, bytes calldata, bytes calldata, address payable, address, bytes calldata)
        external
        payable
    {}

    function estimateFees(uint32, address, bytes calldata, bool, bytes calldata)
        external
        pure
        returns (uint256, uint256)
    {
        return (0, 0);
    }
}

contract MarketplaceTest is Test {
    Marketplace public marketplace;
    RWA721ONFT public nft;
    MockERC20 public usdc;
    MockPermit2 public permit2;
    MockLayerZeroEndpoint public lzEndpoint;

    address public owner = address(this);
    address public seller = address(0x1);
    address public buyer = address(0x2);
    address public feeRecipient = address(0x3);

    uint256 constant LISTING_PRICE = 1000e6;
    string constant TEST_URI = "ipfs://QmTest123";

    event Listed(
        uint256 indexed listingId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        uint256 price
    );
    event Bought(
        uint256 indexed listingId,
        address indexed buyer,
        address indexed seller,
        uint256 price,
        uint256 platformFee
    );
    event Canceled(uint256 indexed listingId);

    function setUp() public {
        usdc = new MockERC20();
        permit2 = new MockPermit2();
        lzEndpoint = new MockLayerZeroEndpoint();

        marketplace = new Marketplace(
            address(usdc),
            address(permit2),
            feeRecipient,
            Config.DEFAULT_PLATFORM_FEE_BPS
        );

        nft = new RWA721ONFT(
            "RWA Tokenizer",
            "RWA",
            address(lzEndpoint),
            Config.LZ_CHAIN_ID_BASE_SEPOLIA
        );

        usdc.mint(buyer, 10000e6);

        vm.prank(buyer);
        usdc.approve(address(permit2), type(uint256).max);
    }

    function testCreateListing() public {
        uint256 tokenId = nft.mint(seller, TEST_URI);

        vm.startPrank(seller);
        nft.approve(address(marketplace), tokenId);

        vm.expectEmit(true, true, true, true);
        emit Listed(1, address(nft), tokenId, seller, LISTING_PRICE);

        uint256 listingId = marketplace.createListing(address(nft), tokenId, LISTING_PRICE);
        vm.stopPrank();

        assertEq(listingId, 1);

        Types.Listing memory listing = marketplace.getListing(listingId);
        assertEq(listing.nftContract, address(nft));
        assertEq(listing.tokenId, tokenId);
        assertEq(listing.seller, seller);
        assertEq(listing.price, LISTING_PRICE);
        assertTrue(listing.active);
    }

    function testCreateListingNotOwner() public {
        uint256 tokenId = nft.mint(seller, TEST_URI);

        vm.prank(buyer);
        vm.expectRevert(abi.encodeWithSignature("TokenNotOwned()"));
        marketplace.createListing(address(nft), tokenId, LISTING_PRICE);
    }

    function testCreateListingNotApproved() public {
        uint256 tokenId = nft.mint(seller, TEST_URI);

        vm.prank(seller);
        vm.expectRevert(abi.encodeWithSignature("NotApprovedForTransfer()"));
        marketplace.createListing(address(nft), tokenId, LISTING_PRICE);
    }

    function testCreateListingInvalidPrice() public {
        uint256 tokenId = nft.mint(seller, TEST_URI);

        vm.startPrank(seller);
        nft.approve(address(marketplace), tokenId);

        vm.expectRevert(abi.encodeWithSignature("InvalidPrice()"));
        marketplace.createListing(address(nft), tokenId, 0);
        vm.stopPrank();
    }

    function testCancelListing() public {
        uint256 tokenId = nft.mint(seller, TEST_URI);

        vm.startPrank(seller);
        nft.approve(address(marketplace), tokenId);
        uint256 listingId = marketplace.createListing(address(nft), tokenId, LISTING_PRICE);

        vm.expectEmit(true, false, false, false);
        emit Canceled(listingId);

        marketplace.cancelListing(listingId);
        vm.stopPrank();

        Types.Listing memory listing = marketplace.getListing(listingId);
        assertFalse(listing.active);
    }

    function testCancelListingNotSeller() public {
        uint256 tokenId = nft.mint(seller, TEST_URI);

        vm.startPrank(seller);
        nft.approve(address(marketplace), tokenId);
        uint256 listingId = marketplace.createListing(address(nft), tokenId, LISTING_PRICE);
        vm.stopPrank();

        vm.prank(buyer);
        vm.expectRevert(abi.encodeWithSignature("NotListingSeller()"));
        marketplace.cancelListing(listingId);
    }

    function testBuy() public {
        uint256 tokenId = nft.mint(seller, TEST_URI);

        vm.startPrank(seller);
        nft.approve(address(marketplace), tokenId);
        uint256 listingId = marketplace.createListing(address(nft), tokenId, LISTING_PRICE);
        vm.stopPrank();

        IPermit2.PermitTransferFrom memory permit = IPermit2.PermitTransferFrom({
            permitted: IPermit2.TokenPermissions({token: address(usdc), amount: LISTING_PRICE}),
            nonce: 0,
            deadline: block.timestamp + 1 hours
        });

        IPermit2.SignatureTransferDetails memory transferDetails = IPermit2
            .SignatureTransferDetails({to: address(marketplace), requestedAmount: LISTING_PRICE});

        uint256 platformFee = (LISTING_PRICE * Config.DEFAULT_PLATFORM_FEE_BPS)
            / Config.BPS_DENOMINATOR;
        uint256 sellerProceeds = LISTING_PRICE - platformFee;

        uint256 buyerBalanceBefore = usdc.balanceOf(buyer);
        uint256 sellerBalanceBefore = usdc.balanceOf(seller);
        uint256 feeRecipientBalanceBefore = usdc.balanceOf(feeRecipient);

        vm.prank(buyer);
        marketplace.buy(listingId, buyer, permit, transferDetails, "");

        assertEq(nft.ownerOf(tokenId), buyer);
        assertEq(usdc.balanceOf(buyer), buyerBalanceBefore - LISTING_PRICE);
        assertEq(usdc.balanceOf(seller), sellerBalanceBefore + sellerProceeds);
        assertEq(usdc.balanceOf(feeRecipient), feeRecipientBalanceBefore + platformFee);

        Types.Listing memory listing = marketplace.getListing(listingId);
        assertFalse(listing.active);
    }

    function testBuyInactiveListing() public {
        uint256 tokenId = nft.mint(seller, TEST_URI);

        vm.startPrank(seller);
        nft.approve(address(marketplace), tokenId);
        uint256 listingId = marketplace.createListing(address(nft), tokenId, LISTING_PRICE);
        marketplace.cancelListing(listingId);
        vm.stopPrank();

        IPermit2.PermitTransferFrom memory permit = IPermit2.PermitTransferFrom({
            permitted: IPermit2.TokenPermissions({token: address(usdc), amount: LISTING_PRICE}),
            nonce: 0,
            deadline: block.timestamp + 1 hours
        });

        IPermit2.SignatureTransferDetails memory transferDetails = IPermit2
            .SignatureTransferDetails({to: address(marketplace), requestedAmount: LISTING_PRICE});

        vm.prank(buyer);
        vm.expectRevert(abi.encodeWithSignature("ListingNotActive()"));
        marketplace.buy(listingId, buyer, permit, transferDetails, "");
    }

    function testPause() public {
        marketplace.pause();

        uint256 tokenId = nft.mint(seller, TEST_URI);
        vm.prank(seller);
        nft.approve(address(marketplace), tokenId);

        vm.prank(seller);
        vm.expectRevert();
        marketplace.createListing(address(nft), tokenId, LISTING_PRICE);
    }

    function testUnpause() public {
        marketplace.pause();
        marketplace.unpause();

        uint256 tokenId = nft.mint(seller, TEST_URI);
        vm.startPrank(seller);
        nft.approve(address(marketplace), tokenId);
        uint256 listingId = marketplace.createListing(address(nft), tokenId, LISTING_PRICE);
        vm.stopPrank();

        assertEq(listingId, 1);
    }
}
