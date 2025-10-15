// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Test.sol";
import "../contracts/RWA721ONFT.sol";
import "../contracts/Config.sol";

contract MockLayerZeroEndpoint {
    uint32 public chainId;

    constructor(uint32 _chainId) {
        chainId = _chainId;
    }

    function send(
        uint32,
        bytes calldata,
        bytes calldata,
        address payable,
        address,
        bytes calldata
    ) external payable {}

    function estimateFees(uint32, address, bytes calldata, bool, bytes calldata)
        external
        pure
        returns (uint256, uint256)
    {
        return (0.01 ether, 0);
    }
}

contract RWATest is Test {
    RWA721ONFT public rwa;
    MockLayerZeroEndpoint public mockEndpoint;

    address public owner = address(this);
    address public user1 = address(0x1);
    address public user2 = address(0x2);

    string constant TEST_URI = "ipfs://QmTest123";

    event Minted(address indexed to, uint256 indexed tokenId, string uri);
    event BridgeSent(
        uint32 indexed dstChainId,
        address indexed from,
        address indexed to,
        uint256 tokenId
    );

    function setUp() public {
        mockEndpoint = new MockLayerZeroEndpoint(Config.LZ_CHAIN_ID_BASE_SEPOLIA);
        rwa = new RWA721ONFT(
            "RWA Tokenizer",
            "RWA",
            address(mockEndpoint),
            Config.LZ_CHAIN_ID_BASE_SEPOLIA
        );

        vm.deal(user1, 1 ether);
        vm.deal(user2, 1 ether);
    }

    function testMint() public {
        vm.expectEmit(true, true, false, true);
        emit Minted(user1, 1, TEST_URI);

        uint256 tokenId = rwa.mint(user1, TEST_URI);

        assertEq(tokenId, 1);
        assertEq(rwa.ownerOf(tokenId), user1);
        assertEq(rwa.tokenURI(tokenId), TEST_URI);
    }

    function testMintMultiple() public {
        uint256 tokenId1 = rwa.mint(user1, TEST_URI);
        uint256 tokenId2 = rwa.mint(user2, "ipfs://QmTest456");

        assertEq(tokenId1, 1);
        assertEq(tokenId2, 2);
        assertEq(rwa.ownerOf(tokenId1), user1);
        assertEq(rwa.ownerOf(tokenId2), user2);
    }

    function testMintOnlyOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        rwa.mint(user2, TEST_URI);
    }

    function testMintInvalidAddress() public {
        vm.expectRevert(abi.encodeWithSignature("InvalidAddress()"));
        rwa.mint(address(0), TEST_URI);
    }

    function testTokenURI() public {
        uint256 tokenId = rwa.mint(user1, TEST_URI);
        assertEq(rwa.tokenURI(tokenId), TEST_URI);
    }

    function testBridgeInfo() public {
        uint256 tokenId = rwa.mint(user1, TEST_URI);
        (uint32 originChainId, bool isBridged, uint256 bridgeCount) = rwa.bridgeInfo(tokenId);

        assertEq(originChainId, Config.LZ_CHAIN_ID_BASE_SEPOLIA);
        assertFalse(isBridged);
        assertEq(bridgeCount, 0);
    }

    function testSetTrustedRemote() public {
        bytes memory remoteAddress = abi.encodePacked(address(0x123));
        rwa.setTrustedRemote(Config.LZ_CHAIN_ID_SEPOLIA, remoteAddress);

        assertEq(
            keccak256(rwa.trustedRemoteLookup(Config.LZ_CHAIN_ID_SEPOLIA)),
            keccak256(remoteAddress)
        );
    }

    function testSetTrustedRemoteOnlyOwner() public {
        bytes memory remoteAddress = abi.encodePacked(address(0x123));
        vm.prank(user1);
        vm.expectRevert();
        rwa.setTrustedRemote(Config.LZ_CHAIN_ID_SEPOLIA, remoteAddress);
    }

    function testPause() public {
        rwa.pause();
        vm.expectRevert();
        rwa.mint(user1, TEST_URI);
    }

    function testUnpause() public {
        rwa.pause();
        rwa.unpause();
        uint256 tokenId = rwa.mint(user1, TEST_URI);
        assertEq(tokenId, 1);
    }

    function testPauseOnlyOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        rwa.pause();
    }

    function testRoyalty() public {
        rwa.setDefaultRoyalty(owner, 500);
        uint256 tokenId = rwa.mint(user1, TEST_URI);

        (address receiver, uint256 royaltyAmount) = rwa.royaltyInfo(tokenId, 10000);
        assertEq(receiver, owner);
        assertEq(royaltyAmount, 500);
    }

    function testSendFromRequiresTrustedRemote() public {
        uint256 tokenId = rwa.mint(user1, TEST_URI);

        vm.prank(user1);
        rwa.approve(address(rwa), tokenId);

        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSignature("InvalidChainId()"));
        rwa.sendFrom{value: 0.01 ether}(
            user1,
            Config.LZ_CHAIN_ID_SEPOLIA,
            abi.encodePacked(user2),
            tokenId,
            payable(user1),
            address(0),
            ""
        );
    }

    function testEstimateSendFee() public {
        uint256 tokenId = rwa.mint(user1, TEST_URI);
        bytes memory toAddress = abi.encodePacked(user2);

        (uint256 nativeFee, uint256 zroFee) = rwa.estimateSendFee(
            Config.LZ_CHAIN_ID_SEPOLIA,
            toAddress,
            tokenId,
            false,
            ""
        );

        assertEq(nativeFee, 0.01 ether);
        assertEq(zroFee, 0);
    }
}
