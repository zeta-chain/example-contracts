// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@zetachain/protocol-contracts/contracts/zevm/SystemContract.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/zContract.sol";
import "@zetachain/toolkit/contracts/BytesHelperLib.sol";
import "@zetachain/toolkit/contracts/SwapHelperLib.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@zetachain/toolkit/contracts/OnlySystem.sol";

contract Multioutput is zContract, Ownable, OnlySystem {
    error NoAvailableTransfers();
    error InvalidRecipient();
    error FetchingBTCZRC20Failed();

    event Withdrawal(address, uint256, bytes);

    SystemContract public systemContract;

    uint256 constant BITCOIN = 18332;

    constructor(address systemContractAddress) {
        systemContract = SystemContract(systemContractAddress);
    }

    function onCrossChainCall(
        zContext calldata context,
        address zrc20,
        uint256 amount,
        bytes calldata message
    ) external virtual override onlySystem(systemContract) {
        if (systemContract.gasCoinZRC20ByChainId(BITCOIN) == address(0))
            revert FetchingBTCZRC20Failed();

        (
            address evmRecipient,
            bytes memory btcRecipient,
            address[] memory destinationTokens
        ) = parseMessage(context.chainID, message);

        uint256 totalTransfers = destinationTokens.length;
        if (totalTransfers == 0) revert NoAvailableTransfers();

        uint256 amountToTransfer = amount / totalTransfers;
        uint256 leftOver = amount - amountToTransfer * totalTransfers;

        uint256 lastTransferIndex = destinationTokens[
            destinationTokens.length - 1
        ] == zrc20
            ? destinationTokens.length - 2
            : destinationTokens.length - 1;

        for (uint256 i; i < destinationTokens.length; i++) {
            address targetZRC20 = destinationTokens[i];
            if (targetZRC20 == zrc20) continue;

            if (lastTransferIndex == i) {
                amountToTransfer += leftOver;
            }

            bytes memory recipient = abi.encodePacked(
                BytesHelperLib.addressToBytes(evmRecipient)
            );

            if (targetZRC20 == systemContract.gasCoinZRC20ByChainId(BITCOIN)) {
                if (btcRecipient.length == 0) revert InvalidRecipient();
                recipient = abi.encodePacked(btcRecipient);
            }

            _doSwapAndWithdraw(zrc20, amountToTransfer, targetZRC20, recipient);
        }
    }

    function _doSwapAndWithdraw(
        address zrc20,
        uint256 amountToTransfer,
        address targetZRC20,
        bytes memory recipient
    ) internal {
        (address gasZRC20, uint256 gasFee) = IZRC20(targetZRC20)
            .withdrawGasFee();

        uint256 inputForGas = SwapHelperLib.swapTokensForExactTokens(
            systemContract,
            zrc20,
            gasFee,
            gasZRC20,
            amountToTransfer
        );

        uint256 outputAmount = SwapHelperLib.swapExactTokensForTokens(
            systemContract,
            zrc20,
            amountToTransfer - inputForGas,
            targetZRC20,
            0
        );

        IZRC20(gasZRC20).approve(targetZRC20, gasFee);
        IZRC20(targetZRC20).withdraw(recipient, outputAmount);
    }

    function parseMessage(
        uint256 chainID,
        bytes calldata message
    ) public pure returns (address, bytes memory, address[] memory) {
        address evmRecipient;
        bytes memory btcRecipient;
        address[] memory destinationTokens;
        if (chainID == BITCOIN) {
            evmRecipient = BytesHelperLib.bytesToAddress(message, 0);
            uint256 numTokens = message.length / 20 - 1;
            destinationTokens = new address[](numTokens);
            for (uint256 i = 0; i < numTokens; i++) {
                destinationTokens[i] = BytesHelperLib.bytesToAddress(
                    message,
                    20 + i * 20
                );
            }
        } else {
            (
                address evmAddress,
                bytes memory btcAddress,
                bytes memory targetTokens
            ) = abi.decode(message, (address, bytes, bytes));

            btcRecipient = btcAddress;
            evmRecipient = evmAddress;

            uint256 numTokens = targetTokens.length / 32;
            destinationTokens = new address[](numTokens);
            for (uint256 i = 0; i < numTokens; i++) {
                destinationTokens[i] = BytesHelperLib.bytesMemoryToAddress(
                    targetTokens,
                    i * 32
                );
            }
        }

        return (evmRecipient, btcRecipient, destinationTokens);
    }
}
