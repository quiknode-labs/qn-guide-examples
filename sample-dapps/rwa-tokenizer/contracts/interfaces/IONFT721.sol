// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/**
 * @title IONFT721
 * @notice Interface for LayerZero ONFT v2 (ERC-721) standard
 * @dev Minimal adapter for cross-chain NFT bridging via LayerZero
 */
interface IONFT721 is IERC721 {
    /**
     * @notice Emitted when an NFT is sent to another chain
     */
    event SendToChain(
        uint16 indexed dstChainId,
        address indexed from,
        bytes indexed toAddress,
        uint256 tokenId
    );

    /**
     * @notice Emitted when an NFT is received from another chain
     */
    event ReceiveFromChain(
        uint16 indexed srcChainId,
        bytes indexed srcAddress,
        address indexed toAddress,
        uint256 tokenId
    );

    /**
     * @notice Send an NFT to another chain via LayerZero
     * @param dstChainId LayerZero chain ID of destination
     * @param from Address sending the NFT
     * @param tokenId ID of the token to send
     * @param refundAddress Address to refund excess gas fees
     * @param zroPaymentAddress ZRO token payment address (can be zero)
     * @param adapterParams Custom adapter parameters for LayerZero
     */
    function sendFrom(
        address from,
        uint16 dstChainId,
        bytes calldata toAddress,
        uint256 tokenId,
        address payable refundAddress,
        address zroPaymentAddress,
        bytes calldata adapterParams
    ) external payable;

    /**
     * @notice Estimate gas fees for sending NFT cross-chain
     * @param dstChainId Destination LayerZero chain ID
     * @param toAddress Recipient address on destination chain
     * @param tokenId Token ID to send
     * @param useZro Whether to pay in ZRO token
     * @param adapterParams Custom adapter parameters
     * @return nativeFee Native token fee amount
     * @return zroFee ZRO token fee amount
     */
    function estimateSendFee(
        uint16 dstChainId,
        bytes calldata toAddress,
        uint256 tokenId,
        bool useZro,
        bytes calldata adapterParams
    ) external view returns (uint256 nativeFee, uint256 zroFee);
}
