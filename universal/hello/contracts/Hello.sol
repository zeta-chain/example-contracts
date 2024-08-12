// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/zContract.sol";

/// @title Hello
/// @notice This contract is used just for testing.
/// @dev Implements the UniversalContract interface for handling cross-chain calls and reverts.
contract Hello is UniversalContract {
    /// @notice Emitted when a cross-chain call is received.
    /// @param origin The origin address on the external chain.
    /// @param sender The sender address on the external chain.
    /// @param chainID The chain ID of the external chain.
    /// @param msgSender The sender address on the current chain.
    /// @param message The decoded message from the cross-chain call.
    event ContextData(
        bytes origin,
        address sender,
        uint256 chainID,
        address msgSender,
        string message
    );

    /// @notice Emitted when a cross-chain call is reverted.
    /// @param origin The origin address on the external chain.
    /// @param sender The sender address on the external chain.
    /// @param chainID The chain ID of the external chain.
    /// @param msgSender The sender address on the current chain.
    /// @param message The decoded message from the revert call.
    event ContextDataRevert(
        bytes origin,
        address sender,
        uint256 chainID,
        address msgSender,
        string message
    );

    /// @notice Handles a cross-chain call.
    /// @param context The context of the cross-chain call.
    /// @param zrc20 The address of the ZRC20 token.
    /// @param amount The amount of tokens transferred.
    /// @param message The calldata passed to the contract call.
    /// @dev Decodes the message and emits a ContextData event.
    function onCrossChainCall(
        zContext calldata context,
        address zrc20,
        uint256 amount,
        bytes calldata message
    ) external override {
        string memory decodedMessage;
        if (message.length > 0) {
            decodedMessage = abi.decode(message, (string));
        }
        emit ContextData(
            context.origin,
            context.sender,
            context.chainID,
            msg.sender,
            decodedMessage
        );
    }

    /// @notice Handles a cross-chain call revert.
    /// @param context The context of the revert call.
    /// @param zrc20 The address of the ZRC20 token.
    /// @param amount The amount of tokens to revert.
    /// @param message The calldata passed to the contract call.
    /// @dev Decodes the message and emits a ContextDataRevert event.
    function onRevert(
        revertContext calldata context,
        address zrc20,
        uint256 amount,
        bytes calldata message
    ) external override {
        string memory decodedMessage;
        if (message.length > 0) {
            decodedMessage = abi.decode(message, (string));
        }
        emit ContextDataRevert(
            context.origin,
            context.sender,
            context.chainID,
            msg.sender,
            decodedMessage
        );
    }

    /// @notice Allows the contract to receive ETH.
    receive() external payable {}

    /// @notice Fallback function to receive ETH.
    fallback() external payable {}
}
