// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Test.sol";
import "../contracts/RWA721ONFT.sol";
import "../contracts/Config.sol";

contract MockLayerZeroEndpointWithReceive {
    uint32 public chainId;
    address public onftContract;

    event SendCalled(
        uint32 dstChainId,
        bytes destination,
        bytes payload,
        address refundAddress
    );

    constructor(uint32 _chainId) {
        chainId = _chainId;
    }

    function setONFTContract(address _onft) external {
        onftContract = _onft;
    }

    function send(
        uint32 _dstChainId,
        bytes calldata _destination,
        bytes calldata _payload,
        address payable _refundAddress,
        address,
        bytes calldata
    ) external payable {
        emit SendCalled(_dstChainId, _destination, _payload, _refundAddress);
    }

    function simulateReceive(
        uint32 _srcChainId,
        bytes calldata _srcAddress,
        uint64 _nonce,
        bytes calldata _payload
    ) external {
        RWA721ONFT(onftContract).lzReceive(_srcChainId, _srcAddress, _nonce, _payload);
    }

    function estimateFees(uint16, address, bytes calldata, bool, bytes calldata)
        external
        pure
        returns (uint256, uint256)
    {
        return (0.01 ether, 0);
    }
}

contract BridgeStubTest is Test {
    RWA721ONFT public baseRWA;
    RWA721ONFT public sepoliaRWA;
    MockLayerZeroEndpointWithReceive public baseEndpoint;
    MockLayerZeroEndpointWithReceive public sepoliaEndpoint;

    address public owner = address(this);
    address public user1 = address(0x1);
    address public user2 = address(0x2);

    string constant TEST_URI = "ipfs://QmTest123";

    event BridgeSent(
        uint32 indexed dstChainId,
        address indexed from,
        address indexed to,
        uint256 tokenId
    );
    event BridgeReceived(uint32 indexed srcChainId, address indexed to, uint256 tokenId);

    function setUp() public {
        baseEndpoint =
            new MockLayerZeroEndpointWithReceive(Config.LZ_CHAIN_ID_BASE_SEPOLIA);
        sepoliaEndpoint = new MockLayerZeroEndpointWithReceive(Config.LZ_CHAIN_ID_SEPOLIA);

        baseRWA = new RWA721ONFT(
            "RWA Tokenizer Base",
            "RWA",
            address(baseEndpoint),
            Config.LZ_CHAIN_ID_BASE_SEPOLIA
        );

        sepoliaRWA = new RWA721ONFT(
            "RWA Tokenizer Sepolia",
            "RWA",
            address(sepoliaEndpoint),
            Config.LZ_CHAIN_ID_SEPOLIA
        );

        baseEndpoint.setONFTContract(address(baseRWA));
        sepoliaEndpoint.setONFTContract(address(sepoliaRWA));

        baseRWA.setTrustedRemote(
            Config.LZ_CHAIN_ID_SEPOLIA,
            abi.encodePacked(address(sepoliaRWA))
        );
        sepoliaRWA.setTrustedRemote(
            Config.LZ_CHAIN_ID_BASE_SEPOLIA,
            abi.encodePacked(address(baseRWA))
        );

        vm.deal(user1, 1 ether);
        vm.deal(user2, 1 ether);
    }

    function testBridgeSendEmitsEvent() public {
        uint256 tokenId = baseRWA.mint(user1, TEST_URI);

        vm.prank(user1);
        baseRWA.approve(address(baseRWA), tokenId);

        vm.expectEmit(true, true, true, false);
        emit BridgeSent(Config.LZ_CHAIN_ID_SEPOLIA, user1, user2, tokenId);

        vm.prank(user1);
        baseRWA.sendFrom{value: 0.01 ether}(
            user1,
            Config.LZ_CHAIN_ID_SEPOLIA,
            abi.encodePacked(user2),
            tokenId,
            payable(user1),
            address(0),
            ""
        );
    }

    function testBridgeSendBurnsToken() public {
        uint256 tokenId = baseRWA.mint(user1, TEST_URI);

        vm.prank(user1);
        baseRWA.approve(address(baseRWA), tokenId);

        vm.prank(user1);
        baseRWA.sendFrom{value: 0.01 ether}(
            user1,
            Config.LZ_CHAIN_ID_SEPOLIA,
            abi.encodePacked(user2),
            tokenId,
            payable(user1),
            address(0),
            ""
        );

        vm.expectRevert();
        baseRWA.ownerOf(tokenId);
    }

    function testBridgeSendUpdatesBridgeInfo() public {
        uint256 tokenId = baseRWA.mint(user1, TEST_URI);

        vm.prank(user1);
        baseRWA.approve(address(baseRWA), tokenId);

        vm.prank(user1);
        baseRWA.sendFrom{value: 0.01 ether}(
            user1,
            Config.LZ_CHAIN_ID_SEPOLIA,
            abi.encodePacked(user2),
            tokenId,
            payable(user1),
            address(0),
            ""
        );

        (uint32 originChainId, bool isBridged, uint256 bridgeCount) =
            baseRWA.bridgeInfo(tokenId);

        assertEq(originChainId, Config.LZ_CHAIN_ID_BASE_SEPOLIA);
        assertTrue(isBridged);
        assertEq(bridgeCount, 1);
    }

    function testBridgeReceiveMintsToken() public {
        uint256 tokenId = baseRWA.mint(user1, TEST_URI);

        bytes memory payload = abi.encode(abi.encodePacked(user2), tokenId, TEST_URI);

        vm.expectEmit(true, true, false, false);
        emit BridgeReceived(Config.LZ_CHAIN_ID_BASE_SEPOLIA, user2, tokenId);

        sepoliaEndpoint.simulateReceive(
            Config.LZ_CHAIN_ID_BASE_SEPOLIA,
            abi.encodePacked(address(baseRWA)),
            1,
            payload
        );

        assertEq(sepoliaRWA.ownerOf(tokenId), user2);
        assertEq(sepoliaRWA.tokenURI(tokenId), TEST_URI);
    }

    function testBridgeReceiveUpdatesBridgeInfo() public {
        uint256 tokenId = 1;
        bytes memory payload = abi.encode(abi.encodePacked(user2), tokenId, TEST_URI);

        sepoliaEndpoint.simulateReceive(
            Config.LZ_CHAIN_ID_BASE_SEPOLIA,
            abi.encodePacked(address(baseRWA)),
            1,
            payload
        );

        (uint32 originChainId, bool isBridged, uint256 bridgeCount) =
            sepoliaRWA.bridgeInfo(tokenId);

        assertEq(originChainId, Config.LZ_CHAIN_ID_BASE_SEPOLIA);
        assertTrue(isBridged);
        assertEq(bridgeCount, 1);
    }

    function testBridgeReceiveOnlyFromEndpoint() public {
        uint256 tokenId = 1;
        bytes memory payload = abi.encode(abi.encodePacked(user2), tokenId, TEST_URI);

        vm.expectRevert(abi.encodeWithSignature("Unauthorized()"));
        sepoliaRWA.lzReceive(
            Config.LZ_CHAIN_ID_BASE_SEPOLIA,
            abi.encodePacked(address(baseRWA)),
            1,
            payload
        );
    }

    function testBridgeReceiveOnlyFromTrustedRemote() public {
        uint256 tokenId = 1;
        bytes memory payload = abi.encode(abi.encodePacked(user2), tokenId, TEST_URI);

        vm.prank(address(sepoliaEndpoint));
        vm.expectRevert(abi.encodeWithSignature("Unauthorized()"));
        sepoliaRWA.lzReceive(
            Config.LZ_CHAIN_ID_BASE_SEPOLIA,
            abi.encodePacked(address(0x999)),
            1,
            payload
        );
    }

    function testFullBridgeFlow() public {
        uint256 tokenId = baseRWA.mint(user1, TEST_URI);

        assertEq(baseRWA.ownerOf(tokenId), user1);

        vm.prank(user1);
        baseRWA.approve(address(baseRWA), tokenId);

        vm.prank(user1);
        baseRWA.sendFrom{value: 0.01 ether}(
            user1,
            Config.LZ_CHAIN_ID_SEPOLIA,
            abi.encodePacked(user2),
            tokenId,
            payable(user1),
            address(0),
            ""
        );

        vm.expectRevert();
        baseRWA.ownerOf(tokenId);

        bytes memory payload = abi.encode(abi.encodePacked(user2), tokenId, TEST_URI);
        sepoliaEndpoint.simulateReceive(
            Config.LZ_CHAIN_ID_BASE_SEPOLIA,
            abi.encodePacked(address(baseRWA)),
            1,
            payload
        );

        assertEq(sepoliaRWA.ownerOf(tokenId), user2);
        assertEq(sepoliaRWA.tokenURI(tokenId), TEST_URI);
    }
}
