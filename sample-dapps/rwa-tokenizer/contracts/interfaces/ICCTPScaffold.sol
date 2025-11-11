// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/**
 * @title ICCTPScaffold
 * @notice Scaffold interface for Circle's Cross-Chain Transfer Protocol
 * @dev This is a simplified interface. Replace with official CCTP SDK in production.
 *
 * CCTP Flow (TODO - implement with Circle SDK):
 * 1. Source chain: burn USDC via TokenMessenger
 * 2. Receive attestation from Circle's attestation service
 * 3. Destination chain: mint USDC via MessageTransmitter with attestation
 *
 * Official contracts:
 * - TokenMessenger: handles USDC burn/mint
 * - MessageTransmitter: handles cross-chain message verification
 */
interface ICCTPScaffold {
    /**
     * @notice Burn USDC on source chain to initiate cross-chain transfer
     * @param amount USDC amount to burn (6 decimals)
     * @param destinationDomain CCTP domain ID of destination chain
     * @param mintRecipient Recipient address on destination chain (bytes32)
     * @param burnToken USDC address on source chain
     * @return nonce Message nonce for tracking
     */
    function depositForBurn(
        uint256 amount,
        uint32 destinationDomain,
        bytes32 mintRecipient,
        address burnToken
    ) external returns (uint64 nonce);

    /**
     * @notice Receive minted USDC on destination chain
     * @param message Encoded message from source chain
     * @param attestation Circle attestation signature
     * @return success Whether the message was successfully received
     */
    function receiveMessage(
        bytes calldata message,
        bytes calldata attestation
    ) external returns (bool success);

    event MessageSent(bytes message);
    event MessageReceived(
        address indexed caller,
        uint32 sourceDomain,
        uint64 indexed nonce,
        bytes32 sender,
        bytes messageBody
    );
}
