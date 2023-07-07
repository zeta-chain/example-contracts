// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@zetachain/protocol-contracts/contracts/zevm/interfaces/IZRC20.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/zContract.sol";

/**
 * @title Withdraw
 * @dev This contract enables the withdrawal of ZRC20 tokens.
 */
contract Withdraw is zContract {
    error WrongGasContract();
    error NotEnoughToPayGasFee();
    error InvalidZRC20Address();
    error ZeroAmount();

    /**
     * @dev Internal function that handles the withdrawal of ZRC20 tokens.
     * @param targetZRC20 The address of the ZRC20 token to be withdrawn.
     * @param amount The amount of tokens to be withdrawn.
     * @param recipient The recipient address for the withdrawn tokens.
     */
    function doWithdrawal(
        address targetZRC20,
        uint256 amount,
        bytes32 recipient
    ) private {
        (address gasZRC20, uint256 gasFee) = IZRC20(targetZRC20)
            .withdrawGasFee();

        if (gasZRC20 != targetZRC20) revert WrongGasContract();
        if (gasFee >= amount) revert NotEnoughToPayGasFee();

        IZRC20(targetZRC20).approve(targetZRC20, gasFee);
        IZRC20(targetZRC20).withdraw(
            abi.encodePacked(recipient),
            amount - gasFee
        );
    }

    /**
     * @dev External function that is called by the zContract.
     * @param zrc20 The address of the ZRC20 token to be withdrawn.
     * @param amount The amount of tokens to be withdrawn.
     * @param message The encoded recipient address for the withdrawn tokens.
     */
    function onCrossChainCall(
        address zrc20,
        uint256 amount,
        bytes calldata message
    ) external virtual override {
        if (zrc20 == address(0)) revert InvalidZRC20Address();
        if (amount == 0) revert ZeroAmount();

        bytes32 recipient = abi.decode(message, (bytes32));
        doWithdrawal(zrc20, amount, recipient);
    }

    /**
     * @dev Public function to initiate the withdrawal of ZRC20 tokens.
     * @param zrc20 The address of the ZRC20 token to be withdrawn.
     * @param amount The amount of tokens to be withdrawn.
     * @param recipient The recipient address for the withdrawn tokens.
     */
    function withdraw(address zrc20, uint256 amount, bytes32 recipient) public {
        if (zrc20 == address(0)) revert InvalidZRC20Address();
        if (amount == 0) revert ZeroAmount();

        doWithdrawal(zrc20, amount, recipient);
    }
}
