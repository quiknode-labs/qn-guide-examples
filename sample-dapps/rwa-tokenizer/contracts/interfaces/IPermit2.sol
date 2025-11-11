// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/**
 * @title IPermit2
 * @notice Interface for Uniswap Permit2 contract
 * @dev Enables gasless token approvals and transfers
 */
interface IPermit2 {
    struct TokenPermissions {
        address token;
        uint256 amount;
    }

    struct PermitTransferFrom {
        TokenPermissions permitted;
        uint256 nonce;
        uint256 deadline;
    }

    struct SignatureTransferDetails {
        address to;
        uint256 requestedAmount;
    }

    /**
     * @notice Transfer tokens using a signed permit
     * @param permit Permit data structure
     * @param transferDetails Transfer recipient and amount
     * @param owner Token owner who signed the permit
     * @param signature EIP-712 signature
     */
    function permitTransferFrom(
        PermitTransferFrom calldata permit,
        SignatureTransferDetails calldata transferDetails,
        address owner,
        bytes calldata signature
    ) external;

    struct PermitSingle {
        PermitDetails details;
        address spender;
        uint256 sigDeadline;
    }

    struct PermitDetails {
        address token;
        uint160 amount;
        uint48 expiration;
        uint48 nonce;
    }

    /**
     * @notice Approve a spender using a signed permit
     * @param owner Token owner
     * @param permitSingle Permit data
     * @param signature EIP-712 signature
     */
    function permit(
        address owner,
        PermitSingle calldata permitSingle,
        bytes calldata signature
    ) external;
}
