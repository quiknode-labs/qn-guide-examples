// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/**
 * @title ILayerZeroEndpoint
 * @notice Interface for LayerZero endpoint contract
 */
interface ILayerZeroEndpoint {
    function send(
        uint32 _dstChainId,
        bytes calldata _destination,
        bytes calldata _payload,
        address payable _refundAddress,
        address _zroPaymentAddress,
        bytes calldata _adapterParams
    ) external payable;

    function estimateFees(
        uint32 _dstChainId,
        address _userApplication,
        bytes calldata _payload,
        bool _payInZRO,
        bytes calldata _adapterParam
    ) external view returns (uint256 nativeFee, uint256 zroFee);

    function getInboundNonce(uint32 _srcChainId, bytes calldata _srcAddress)
        external
        view
        returns (uint64);

    function getOutboundNonce(uint32 _dstChainId, address _srcAddress)
        external
        view
        returns (uint64);
}
