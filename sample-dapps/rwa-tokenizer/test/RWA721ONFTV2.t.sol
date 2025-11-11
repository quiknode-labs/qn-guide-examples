// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Test.sol";
import "../contracts/RWA721ONFTV2.sol";
import { Origin } from "@layerzerolabs/lz-evm-protocol-v2/contracts/interfaces/ILayerZeroEndpointV2.sol";
import { MessagingFee, MessagingReceipt } from "@layerzerolabs/lz-evm-protocol-v2/contracts/interfaces/ILayerZeroEndpointV2.sol";

contract MockEndpointV2 {
    uint32 public eid;

    constructor(uint32 _eid) {
        eid = _eid;
    }

    function send(
        uint32,
        bytes32,
        bytes calldata,
        address,
        bytes calldata,
        bytes calldata
    ) external payable returns (MessagingReceipt memory receipt) {
        receipt = MessagingReceipt({
            guid: bytes32(0),
            nonce: 1,
            fee: MessagingFee({ nativeFee: msg.value, lzTokenFee: 0 })
        });
    }

    function quote(uint32, bytes32, bytes calldata, bool)
        external
        pure
        returns (MessagingFee memory fee)
    {
        fee = MessagingFee({ nativeFee: 0.01 ether, lzTokenFee: 0 });
    }

    function setDelegate(address) external {}
}

contract TestableRWA721ONFTV2 is RWA721ONFTV2 {
    constructor(
        string memory name,
        string memory symbol,
        address lzEndpoint,
        address delegate,
        uint32 originChainId
    ) RWA721ONFTV2(name, symbol, lzEndpoint, delegate, originChainId) {}

    function exposed_credit(address to, uint256 tokenId, uint32 srcEid) external {
        _credit(to, tokenId, srcEid);
    }

    function simulateLzReceive(
        Origin calldata _origin,
        bytes32 _guid,
        bytes calldata _message,
        bytes calldata _extraData
    ) external {
        _lzReceive(_origin, _guid, _message, address(0), _extraData);
    }
}

contract RWA721ONFTV2Test is Test {
    TestableRWA721ONFTV2 public baseRWA;
    TestableRWA721ONFTV2 public sepoliaRWA;
    MockEndpointV2 public baseEndpoint;
    MockEndpointV2 public sepoliaEndpoint;

    address public owner = address(this);
    address public user1 = address(0x1);
    address public user2 = address(0x2);

    uint32 constant BASE_EID = 40245; // Base Sepolia
    uint32 constant SEPOLIA_EID = 40161; // Sepolia

    string constant TEST_URI = "ipfs://QmTest123";

    function setUp() public {
        baseEndpoint = new MockEndpointV2(BASE_EID);
        sepoliaEndpoint = new MockEndpointV2(SEPOLIA_EID);

        baseRWA = new TestableRWA721ONFTV2(
            "RWA Tokenizer Base",
            "RWA",
            address(baseEndpoint),
            owner,
            BASE_EID
        );

        sepoliaRWA = new TestableRWA721ONFTV2(
            "RWA Tokenizer Sepolia",
            "RWA",
            address(sepoliaEndpoint),
            owner,
            SEPOLIA_EID
        );

        vm.deal(user1, 1 ether);
        vm.deal(user2, 1 ether);
    }

    function testMint() public {
        uint256 tokenId = baseRWA.mint(user1, TEST_URI);

        // Token ID should be chain-encoded: 40245 * 1B + 1 = 40,245,000,000,001
        uint256 expectedTokenId = uint256(BASE_EID) * 1_000_000_000 + 1;
        assertEq(tokenId, expectedTokenId);
        assertEq(baseRWA.ownerOf(tokenId), user1);
        assertEq(baseRWA.tokenURI(tokenId), TEST_URI);

        // Next token should be chain-encoded: 40245 * 1B + 2
        uint256 expectedNext = uint256(BASE_EID) * 1_000_000_000 + 2;
        assertEq(baseRWA.nextTokenId(), expectedNext);
    }

    function testMintMultiple() public {
        uint256 tokenId1 = baseRWA.mint(user1, TEST_URI);
        uint256 tokenId2 = baseRWA.mint(user2, "ipfs://QmTest456");

        uint256 expectedToken1 = uint256(BASE_EID) * 1_000_000_000 + 1;
        uint256 expectedToken2 = uint256(BASE_EID) * 1_000_000_000 + 2;
        uint256 expectedNext = uint256(BASE_EID) * 1_000_000_000 + 3;

        assertEq(tokenId1, expectedToken1);
        assertEq(tokenId2, expectedToken2);
        assertEq(baseRWA.nextTokenId(), expectedNext);
    }

    function testCreditUpdatesNextTokenId() public {
        uint256 expectedInitial = uint256(SEPOLIA_EID) * 1_000_000_000 + 1;
        assertEq(sepoliaRWA.nextTokenId(), expectedInitial);

        // Bridge a token from Sepolia (same chain) with local ID 5
        uint256 sepoliaToken5 = uint256(SEPOLIA_EID) * 1_000_000_000 + 5;
        sepoliaRWA.exposed_credit(user1, sepoliaToken5, BASE_EID);

        // Should update to 6 since token is from same chain
        uint256 expectedNext = uint256(SEPOLIA_EID) * 1_000_000_000 + 6;
        assertEq(sepoliaRWA.nextTokenId(), expectedNext);
        assertEq(sepoliaRWA.ownerOf(sepoliaToken5), user1);
    }

    function testCreditWithLowerTokenIdDoesNotUpdateNextTokenId() public {
        uint256 tokenId1 = sepoliaRWA.mint(user1, TEST_URI);
        uint256 expectedToken1 = uint256(SEPOLIA_EID) * 1_000_000_000 + 1;
        assertEq(tokenId1, expectedToken1);

        uint256 expectedNext2 = uint256(SEPOLIA_EID) * 1_000_000_000 + 2;
        assertEq(sepoliaRWA.nextTokenId(), expectedNext2);

        uint256 sepoliaToken10 = uint256(SEPOLIA_EID) * 1_000_000_000 + 10;
        sepoliaRWA.exposed_credit(user2, sepoliaToken10, BASE_EID);

        uint256 expectedNext11 = uint256(SEPOLIA_EID) * 1_000_000_000 + 11;
        assertEq(sepoliaRWA.nextTokenId(), expectedNext11);

        uint256 sepoliaToken5 = uint256(SEPOLIA_EID) * 1_000_000_000 + 5;
        sepoliaRWA.exposed_credit(user2, sepoliaToken5, BASE_EID);
        assertEq(sepoliaRWA.nextTokenId(), expectedNext11);
    }

    function testMintAfterBridgeReceiveNoCollision() public {
        uint256 expectedInitial = uint256(SEPOLIA_EID) * 1_000_000_000 + 1;
        assertEq(sepoliaRWA.nextTokenId(), expectedInitial);

        uint256 sepoliaToken10 = uint256(SEPOLIA_EID) * 1_000_000_000 + 10;
        sepoliaRWA.exposed_credit(user1, sepoliaToken10, BASE_EID);

        uint256 expectedNext11 = uint256(SEPOLIA_EID) * 1_000_000_000 + 11;
        assertEq(sepoliaRWA.nextTokenId(), expectedNext11);
        assertEq(sepoliaRWA.ownerOf(sepoliaToken10), user1);

        uint256 newTokenId = sepoliaRWA.mint(user2, TEST_URI);

        assertEq(newTokenId, expectedNext11);
        assertEq(sepoliaRWA.ownerOf(expectedNext11), user2);
    }

    function testMultipleBridgedTokensUpdateNextTokenId() public {
        uint256 expectedInitial = uint256(SEPOLIA_EID) * 1_000_000_000 + 1;
        assertEq(sepoliaRWA.nextTokenId(), expectedInitial);

        uint256 sepoliaToken3 = uint256(SEPOLIA_EID) * 1_000_000_000 + 3;
        sepoliaRWA.exposed_credit(user1, sepoliaToken3, BASE_EID);
        uint256 expectedNext4 = uint256(SEPOLIA_EID) * 1_000_000_000 + 4;
        assertEq(sepoliaRWA.nextTokenId(), expectedNext4);

        uint256 sepoliaToken1 = uint256(SEPOLIA_EID) * 1_000_000_000 + 1;
        sepoliaRWA.exposed_credit(user1, sepoliaToken1, BASE_EID);
        assertEq(sepoliaRWA.nextTokenId(), expectedNext4);

        uint256 sepoliaToken7 = uint256(SEPOLIA_EID) * 1_000_000_000 + 7;
        sepoliaRWA.exposed_credit(user1, sepoliaToken7, BASE_EID);
        uint256 expectedNext8 = uint256(SEPOLIA_EID) * 1_000_000_000 + 8;
        assertEq(sepoliaRWA.nextTokenId(), expectedNext8);

        uint256 sepoliaToken5 = uint256(SEPOLIA_EID) * 1_000_000_000 + 5;
        sepoliaRWA.exposed_credit(user1, sepoliaToken5, BASE_EID);
        assertEq(sepoliaRWA.nextTokenId(), expectedNext8);

        uint256 newTokenId = sepoliaRWA.mint(user2, TEST_URI);
        assertEq(newTokenId, expectedNext8);
    }

    function testBridgeScenarioNoCollision() public {
        // Mint 3 tokens on Base
        uint256 tokenId1 = baseRWA.mint(user1, TEST_URI);
        uint256 tokenId2 = baseRWA.mint(user1, "ipfs://QmTest456");
        uint256 tokenId3 = baseRWA.mint(user1, "ipfs://QmTest789");

        uint256 baseToken1 = uint256(BASE_EID) * 1_000_000_000 + 1;
        uint256 baseToken2 = uint256(BASE_EID) * 1_000_000_000 + 2;
        uint256 baseToken3 = uint256(BASE_EID) * 1_000_000_000 + 3;
        uint256 baseNext4 = uint256(BASE_EID) * 1_000_000_000 + 4;

        assertEq(tokenId1, baseToken1);
        assertEq(tokenId2, baseToken2);
        assertEq(tokenId3, baseToken3);
        assertEq(baseRWA.nextTokenId(), baseNext4);

        // Sepolia starts fresh
        uint256 sepoliaNext1 = uint256(SEPOLIA_EID) * 1_000_000_000 + 1;
        assertEq(sepoliaRWA.nextTokenId(), sepoliaNext1);

        // Bridge Base token #2 to Sepolia - it keeps its Base prefix!
        sepoliaRWA.exposed_credit(user2, tokenId2, BASE_EID);

        // Sepolia counter should NOT change because bridged token is from Base
        assertEq(sepoliaRWA.nextTokenId(), sepoliaNext1);

        // Mint new token on Sepolia - gets Sepolia prefix
        uint256 newTokenOnSepolia = sepoliaRWA.mint(user2, "ipfs://SepoliaToken");
        uint256 sepoliaToken1 = uint256(SEPOLIA_EID) * 1_000_000_000 + 1;
        assertEq(newTokenOnSepolia, sepoliaToken1);

        // baseToken1 doesn't exist on Sepolia
        vm.expectRevert();
        sepoliaRWA.ownerOf(baseToken1);
    }

    function testOutOfOrderBridgeReceive() public {
        uint256 sepoliaToken10 = uint256(SEPOLIA_EID) * 1_000_000_000 + 10;
        sepoliaRWA.exposed_credit(user1, sepoliaToken10, BASE_EID);
        uint256 expectedNext11 = uint256(SEPOLIA_EID) * 1_000_000_000 + 11;
        assertEq(sepoliaRWA.nextTokenId(), expectedNext11);

        uint256 sepoliaToken3 = uint256(SEPOLIA_EID) * 1_000_000_000 + 3;
        sepoliaRWA.exposed_credit(user1, sepoliaToken3, BASE_EID);
        assertEq(sepoliaRWA.nextTokenId(), expectedNext11);

        uint256 sepoliaToken15 = uint256(SEPOLIA_EID) * 1_000_000_000 + 15;
        sepoliaRWA.exposed_credit(user1, sepoliaToken15, BASE_EID);
        uint256 expectedNext16 = uint256(SEPOLIA_EID) * 1_000_000_000 + 16;
        assertEq(sepoliaRWA.nextTokenId(), expectedNext16);

        uint256 nextMint = sepoliaRWA.mint(user2, TEST_URI);
        assertEq(nextMint, expectedNext16);
    }

    function testBridgeInfoTracking() public {
        uint256 sepoliaToken5 = uint256(SEPOLIA_EID) * 1_000_000_000 + 5;
        sepoliaRWA.exposed_credit(user1, sepoliaToken5, BASE_EID);

        (uint32 originChainId, bool isBridged, uint256 bridgeCount) =
            sepoliaRWA.bridgeInfo(sepoliaToken5);

        assertEq(originChainId, BASE_EID);
        assertTrue(isBridged);
        assertEq(bridgeCount, 1);
    }

    function testPause() public {
        baseRWA.pause();
        vm.expectRevert();
        baseRWA.mint(user1, TEST_URI);
    }

    function testUnpause() public {
        baseRWA.pause();
        baseRWA.unpause();
        uint256 tokenId = baseRWA.mint(user1, TEST_URI);
        uint256 expectedToken1 = uint256(BASE_EID) * 1_000_000_000 + 1;
        assertEq(tokenId, expectedToken1);
    }

    function testGetOriginChainEid() public {
        uint256 baseToken1 = uint256(BASE_EID) * 1_000_000_000 + 1;
        uint256 sepoliaToken1 = uint256(SEPOLIA_EID) * 1_000_000_000 + 1;

        assertEq(baseRWA.getOriginChainEid(baseToken1), BASE_EID);
        assertEq(sepoliaRWA.getOriginChainEid(sepoliaToken1), SEPOLIA_EID);
    }

    function testGetLocalTokenId() public {
        uint256 baseToken5 = uint256(BASE_EID) * 1_000_000_000 + 5;
        uint256 sepoliaToken123 = uint256(SEPOLIA_EID) * 1_000_000_000 + 123;

        assertEq(baseRWA.getLocalTokenId(baseToken5), 5);
        assertEq(sepoliaRWA.getLocalTokenId(sepoliaToken123), 123);
    }

    function testIsNativeToken() public {
        uint256 baseToken1 = uint256(BASE_EID) * 1_000_000_000 + 1;
        uint256 sepoliaToken1 = uint256(SEPOLIA_EID) * 1_000_000_000 + 1;

        assertTrue(baseRWA.isNativeToken(baseToken1));
        assertFalse(baseRWA.isNativeToken(sepoliaToken1));

        assertTrue(sepoliaRWA.isNativeToken(sepoliaToken1));
        assertFalse(sepoliaRWA.isNativeToken(baseToken1));
    }

    function testCrossChainBridgeDoesNotAffectLocalCounter() public {
        // Mint token on Base
        uint256 baseToken1 = baseRWA.mint(user1, TEST_URI);
        uint256 expectedBaseToken1 = uint256(BASE_EID) * 1_000_000_000 + 1;
        assertEq(baseToken1, expectedBaseToken1);

        // Bridge Base token to Sepolia
        sepoliaRWA.exposed_credit(user2, baseToken1, BASE_EID);

        // Sepolia counter should remain at 1 (not affected by Base token)
        uint256 sepoliaNext1 = uint256(SEPOLIA_EID) * 1_000_000_000 + 1;
        assertEq(sepoliaRWA.nextTokenId(), sepoliaNext1);

        // Mint on Sepolia - should get Sepolia token #1
        uint256 sepoliaToken1 = sepoliaRWA.mint(user2, "ipfs://SepoliaToken");
        assertEq(sepoliaToken1, sepoliaNext1);

        // Both tokens exist but have different IDs - no collision!
        assertEq(sepoliaRWA.ownerOf(baseToken1), user2);
        assertEq(sepoliaRWA.ownerOf(sepoliaToken1), user2);
    }

    function testMultipleChainsMintingSameLocalId() public {
        // Both chains mint local token #1
        uint256 baseToken1 = baseRWA.mint(user1, TEST_URI);
        uint256 sepoliaToken1 = sepoliaRWA.mint(user2, TEST_URI);

        // They should have different global IDs
        assertNotEq(baseToken1, sepoliaToken1);

        // Extract chain and local IDs
        assertEq(baseRWA.getOriginChainEid(baseToken1), BASE_EID);
        assertEq(baseRWA.getLocalTokenId(baseToken1), 1);

        assertEq(sepoliaRWA.getOriginChainEid(sepoliaToken1), SEPOLIA_EID);
        assertEq(sepoliaRWA.getLocalTokenId(sepoliaToken1), 1);
    }
}
