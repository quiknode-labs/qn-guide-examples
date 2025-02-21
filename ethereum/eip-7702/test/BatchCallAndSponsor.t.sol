// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console2} from "forge-std/Test.sol";
import {Vm} from "forge-std/Vm.sol";
import {BatchCallAndSponsor} from "../src/BatchCallAndSponsor.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract MockERC20 is ERC20 {
    constructor() ERC20("Mock Token", "MOCK") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract BatchCallAndSponsorTest is Test {
    // Alice's address and private key (EOA with no initial contract code).
    address payable ALICE_ADDRESS = payable(0x70997970C51812dc3A010C7d01b50e0d17dc79C8);
    uint256 constant ALICE_PK = 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d;

    // Bob's address and private key (Bob will execute transactions on Alice's behalf).
    address constant BOB_ADDRESS = 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC;
    uint256 constant BOB_PK = 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a;

    // The contract that Alice will delegate execution to.
    BatchCallAndSponsor public implementation;

    // ERC-20 token contract for minting test tokens.
    MockERC20 public token;

    event CallExecuted(address indexed to, uint256 value, bytes data);
    event BatchExecuted(uint256 indexed nonce, BatchCallAndSponsor.Call[] calls);

    function setUp() public {
        // Deploy the delegation contract (Alice will delegate calls to this contract).
        implementation = new BatchCallAndSponsor();

        // Deploy an ERC-20 token contract where Alice is the minter.
        token = new MockERC20();

        // Fund accounts
        vm.deal(ALICE_ADDRESS, 10 ether);
        token.mint(ALICE_ADDRESS, 1000e18);
    }

    function testDirectExecution() public {
        console2.log("Sending 1 ETH from Alice to Bob and transferring 100 tokens to Bob in a single transaction");
        BatchCallAndSponsor.Call[] memory calls = new BatchCallAndSponsor.Call[](2);

        // ETH transfer
        calls[0] = BatchCallAndSponsor.Call({to: BOB_ADDRESS, value: 1 ether, data: ""});

        // Token transfer
        calls[1] = BatchCallAndSponsor.Call({
            to: address(token),
            value: 0,
            data: abi.encodeCall(ERC20.transfer, (BOB_ADDRESS, 100e18))
        });

        vm.signAndAttachDelegation(address(implementation), ALICE_PK);

        vm.startPrank(ALICE_ADDRESS);
        BatchCallAndSponsor(ALICE_ADDRESS).execute(calls);
        vm.stopPrank();

        assertEq(BOB_ADDRESS.balance, 1 ether);
        assertEq(token.balanceOf(BOB_ADDRESS), 100e18);
    }

    function testSponsoredExecution() public {
        console2.log("Sending 1 ETH from Alice to a random address while the transaction is sponsored by Bob");

        BatchCallAndSponsor.Call[] memory calls = new BatchCallAndSponsor.Call[](1);
        address recipient = makeAddr("recipient");

        calls[0] = BatchCallAndSponsor.Call({to: recipient, value: 1 ether, data: ""});

        // Alice signs a delegation allowing `implementation` to execute transactions on her behalf.
        Vm.SignedDelegation memory signedDelegation = vm.signDelegation(address(implementation), ALICE_PK);

        // Bob attaches the signed delegation from Alice and broadcasts it.
        vm.startBroadcast(BOB_PK);
        vm.attachDelegation(signedDelegation);

        // Verify that Alice's account now temporarily behaves as a smart contract.
        bytes memory code = address(ALICE_ADDRESS).code;
        require(code.length > 0, "no code written to Alice");
        // console2.log("Code on Alice's account:", vm.toString(code));

        // Debug nonce
        // console2.log("Nonce before sending transaction:", BatchCallAndSponsor(ALICE_ADDRESS).nonce());

        bytes memory encodedCalls = "";
        for (uint256 i = 0; i < calls.length; i++) {
            encodedCalls = abi.encodePacked(encodedCalls, calls[i].to, calls[i].value, calls[i].data);
        }

        bytes32 digest = keccak256(abi.encodePacked(BatchCallAndSponsor(ALICE_ADDRESS).nonce(), encodedCalls));

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(ALICE_PK, MessageHashUtils.toEthSignedMessageHash(digest));
        bytes memory signature = abi.encodePacked(r, s, v);

        // Expect the event. The first parameter should be BOB_ADDRESS.
        vm.expectEmit(true, true, true, true);
        emit BatchCallAndSponsor.CallExecuted(BOB_ADDRESS, calls[0].to, calls[0].value, calls[0].data);

        // As Bob, execute the transaction via Alice's temporarily assigned contract.
        BatchCallAndSponsor(ALICE_ADDRESS).execute(calls, signature);

        // console2.log("Nonce after sending transaction:", BatchCallAndSponsor(ALICE_ADDRESS).nonce());

        vm.stopBroadcast();

        assertEq(recipient.balance, 1 ether);
    }

    function testWrongSignature() public {
        console2.log("Test wrong signature: Execution should revert with 'Invalid signature'.");
        BatchCallAndSponsor.Call[] memory calls = new BatchCallAndSponsor.Call[](1);
        calls[0] = BatchCallAndSponsor.Call({
            to: address(token),
            value: 0,
            data: abi.encodeCall(MockERC20.mint, (BOB_ADDRESS, 50))
        });

        // Build the encoded call data.
        bytes memory encodedCalls = "";
        for (uint256 i = 0; i < calls.length; i++) {
            encodedCalls = abi.encodePacked(encodedCalls, calls[i].to, calls[i].value, calls[i].data);
        }

        // Alice signs a delegation allowing `implementation` to execute transactions on her behalf.
        Vm.SignedDelegation memory signedDelegation = vm.signDelegation(address(implementation), ALICE_PK);

        // Bob attaches the signed delegation from Alice and broadcasts it.
        vm.startBroadcast(BOB_PK);
        vm.attachDelegation(signedDelegation);

        bytes32 digest = keccak256(abi.encodePacked(BatchCallAndSponsor(ALICE_ADDRESS).nonce(), encodedCalls));
        // Sign with the wrong key (Bob's instead of Alice's).
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(BOB_PK, MessageHashUtils.toEthSignedMessageHash(digest));
        bytes memory signature = abi.encodePacked(r, s, v);

        vm.expectRevert("Invalid signature");
        BatchCallAndSponsor(ALICE_ADDRESS).execute(calls, signature);
        vm.stopBroadcast();
    }

    function testReplayAttack() public {
        console2.log("Test replay attack: Reusing the same signature should revert.");
        BatchCallAndSponsor.Call[] memory calls = new BatchCallAndSponsor.Call[](1);
        calls[0] = BatchCallAndSponsor.Call({
            to: address(token),
            value: 0,
            data: abi.encodeCall(MockERC20.mint, (BOB_ADDRESS, 30))
        });

        // Build encoded call data.
        bytes memory encodedCalls = "";
        for (uint256 i = 0; i < calls.length; i++) {
            encodedCalls = abi.encodePacked(encodedCalls, calls[i].to, calls[i].value, calls[i].data);
        }

        // Alice signs a delegation allowing `implementation` to execute transactions on her behalf.
        Vm.SignedDelegation memory signedDelegation = vm.signDelegation(address(implementation), ALICE_PK);

        // Bob attaches the signed delegation from Alice and broadcasts it.
        vm.startBroadcast(BOB_PK);
        vm.attachDelegation(signedDelegation);

        uint256 nonceBefore = BatchCallAndSponsor(ALICE_ADDRESS).nonce();
        bytes32 digest = keccak256(abi.encodePacked(nonceBefore, encodedCalls));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(ALICE_PK, MessageHashUtils.toEthSignedMessageHash(digest));
        bytes memory signature = abi.encodePacked(r, s, v);

        // First execution: should succeed.
        BatchCallAndSponsor(ALICE_ADDRESS).execute(calls, signature);
        vm.stopBroadcast();

        // Attempt a replay: reusing the same signature should revert because nonce has incremented.
        vm.expectRevert("Invalid signature");
        BatchCallAndSponsor(ALICE_ADDRESS).execute(calls, signature);
    }
}
