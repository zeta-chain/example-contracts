// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {RevertContext, RevertOptions} from "@zetachain/protocol-contracts/contracts/Revert.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/UniversalContract.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/IGatewayZEVM.sol";
import "@zetachain/protocol-contracts/contracts/zevm/GatewayZEVM.sol";
import {SwapHelperLib} from "@zetachain/toolkit/contracts/SwapHelperLib.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Universal is UniversalContract, Ownable {
    GatewayZEVM public immutable gateway;
    address public immutable uniswapRouter;
    bool public isUniversal = true;

    error TransferFailed();
    error InsufficientOutAmount(uint256 out, uint256 gasFee);
    error Unauthorized();
    error InvalidAddress();

    event GasFeeAndOut(uint256 gasFee, uint256 out);
    event RevertEvent(string);

    event Data(bytes);

    modifier onlyGateway() {
        if (msg.sender != address(gateway)) revert Unauthorized();
        _;
    }

    constructor(
        address payable gatewayAddress,
        address owner,
        address uniswapRouterAddress
    ) Ownable(owner) {
        if (
            gatewayAddress == address(0) ||
            owner == address(0) ||
            uniswapRouterAddress == address(0)
        ) revert InvalidAddress();
        gateway = GatewayZEVM(gatewayAddress);
        uniswapRouter = uniswapRouterAddress;
    }

    function onCall(
        MessageContext calldata context,
        address zrc20,
        uint256 amount,
        bytes calldata message
    ) external override onlyGateway {
        (
            bytes memory receiver,
            address targetToken,
            bytes memory data,
            CallOptions memory callOptions,
            RevertOptions memory revertOptions
        ) = abi.decode(
                message,
                (bytes, address, bytes, CallOptions, RevertOptions)
            );

        uint256 inputForGas;
        address gasZRC20;
        uint256 gasFee;
        uint256 swapAmount;

        (gasZRC20, gasFee) = IZRC20(targetToken).withdrawGasFeeWithGasLimit(
            callOptions.gasLimit
        );
        if (gasZRC20 == zrc20) {
            swapAmount = amount - gasFee;
        } else {
            inputForGas = SwapHelperLib.swapTokensForExactTokens(
                uniswapRouter,
                zrc20,
                gasFee,
                gasZRC20,
                amount
            );
            swapAmount = amount - inputForGas;
        }

        uint256 outputAmount = SwapHelperLib.swapExactTokensForTokens(
            uniswapRouter,
            zrc20,
            swapAmount,
            targetToken,
            0
        );

        if (gasZRC20 == targetToken) {
            IZRC20(gasZRC20).approve(address(gateway), outputAmount + gasFee);
        } else {
            IZRC20(gasZRC20).approve(address(gateway), gasFee);
            IZRC20(targetToken).approve(address(gateway), outputAmount);
        }

        RevertOptions memory revertOptionsUniversal = RevertOptions(
            address(this),
            true,
            address(0),
            abi.encode(
                revertOptions,
                zrc20,
                revertOptions.onRevertGasLimit,
                receiver,
                data
            ),
            callOptions.gasLimit
        );

        bytes memory m = callOptions.isArbitraryCall
            ? abi.encodePacked(data, context.sender, outputAmount, true)
            : abi.encode(data, context.sender, outputAmount, true);

        gateway.withdrawAndCall(
            receiver,
            outputAmount,
            targetToken,
            m,
            callOptions,
            revertOptionsUniversal
        );
    }

    // onRevert is called when a contract on the destination chain reverts.
    // onRevert sends a call back to the source chain
    function onRevert(RevertContext calldata context) external onlyGateway {
        (
            RevertOptions memory revertOptions,
            address destination,
            uint256 onRevertGasLimit,
            bytes memory receiver,
            bytes memory data
        ) = abi.decode(
                context.revertMessage,
                (RevertOptions, address, uint256, bytes, bytes)
            );
        uint256 out = SwapHelperLib.swapExactTokensForTokens(
            uniswapRouter,
            context.asset,
            context.amount,
            destination,
            0
        );
        (, uint256 gasFee) = IZRC20(destination).withdrawGasFeeWithGasLimit(
            onRevertGasLimit
        );
        if (out < gasFee) revert("Insufficient out amount for gas fee");

        IZRC20(destination).approve(address(gateway), out);
        gateway.withdrawAndCall(
            abi.encodePacked(revertOptions.revertAddress),
            out - gasFee,
            destination,
            abi.encode(data, receiver, out - gasFee, false),
            CallOptions(onRevertGasLimit, false),
            RevertOptions(address(0), false, address(0), "", 0)
        );
    }
}
