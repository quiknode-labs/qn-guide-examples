// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/**
 * @title Errors
 * @notice Custom error definitions for gas-efficient reverts
 */
library Errors {
    error Unauthorized();
    error InvalidAddress();
    error InvalidAmount();
    error InvalidTokenId();
    error InvalidChainId();
    error TokenNotFound();
    error TokenAlreadyExists();
    error TokenNotOwned();
    error InsufficientBalance();
    error InsufficientAllowance();
    error TransferFailed();
    error InvalidCurrency();
    error InvalidPrice();
    error ListingNotActive();
    error ListingNotFound();
    error NotListingSeller();
    error AlreadyListed();
    error NotApprovedForTransfer();
    error Paused();
    error BridgeInProgress();
    error InvalidRecipient();
    error InvalidFee();
    error InvalidSignature();
    error ExpiredSignature();
    error InvalidPermit();
}
