// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC6551Registry {
    /**
     * @dev The registry SHALL emit the AccountCreated event upon successful account creation
     */
    event AccountCreated(
        address account,
        address indexed implementation,
        uint256 chainId,
        address indexed tokenContract,
        uint256 indexed tokenId,
        uint256 salt
    );

    /**
     * @dev Creates a token bound account for a non-fungible token
     *
     * If account has already been created, returns the account address without calling create2
     *
     * If initData is not empty and account has not yet been created, calls account with
     * provided initData after creation
     *
     * Emits AccountCreated event
     *
     * @return the address of the account
     */
    function createAccount(
        address implementation,
        uint256 chainId,
        address tokenContract,
        uint256 tokenId,
        uint256 seed,
        bytes calldata initData
    ) external returns (address);

    /**
     * @dev Returns the computed token bound account address for a non-fungible token
     *
     * @return The computed address of the token bound account
     */
    function account(
        address implementation,
        uint256 chainId,
        address tokenContract,
        uint256 tokenId,
        uint256 salt
    ) external view returns (address);
}