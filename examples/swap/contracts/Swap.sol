// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {SystemContract, IZRC20} from "@zetachain/toolkit/contracts/SystemContract.sol";
import {SwapHelperLib} from "@zetachain/toolkit/contracts/SwapHelperLib.sol";
import {BytesHelperLib} from "@zetachain/toolkit/contracts/BytesHelperLib.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {RevertContext, RevertOptions} from "@zetachain/protocol-contracts/contracts/Revert.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/UniversalContract.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/IGatewayZEVM.sol";
import {GatewayZEVM} from "@zetachain/protocol-contracts/contracts/zevm/GatewayZEVM.sol";

contract Swap is UniversalContract {
    address public immutable uniswapRouter;
    GatewayZEVM public gateway;
    uint256 constant BITCOIN = 18332;

    error InvalidAddress();
    error Unauthorized();

    modifier onlyGateway() {
        if (msg.sender != address(gateway)) revert Unauthorized();
        _;
    }

    constructor(address payable gatewayAddress, address uniswapRouterAddress) {
        if (gatewayAddress == address(0) || uniswapRouterAddress == address(0))
            revert InvalidAddress();
        uniswapRouter = uniswapRouterAddress;
        gateway = GatewayZEVM(gatewayAddress);
    }

    struct Params {
        address target;
        bytes to;
    }

    function onCall(
        MessageContext calldata context,
        address zrc20,
        uint256 amount,
        bytes calldata message
    ) external onlyGateway {
        Params memory params = Params({target: address(0), to: bytes("")});
        if (context.chainID == BITCOIN) {
            params.target = BytesHelperLib.bytesToAddress(message, 0);
            params.to = abi.encodePacked(
                BytesHelperLib.bytesToAddress(message, 20)
            );
        } else {
            (address targetToken, bytes memory recipient) = abi.decode(
                message,
                (address, bytes)
            );
            params.target = targetToken;
            params.to = recipient;
        }

        uint256 out = handleGasAndSwap(zrc20, amount, params.target);
        gateway.withdraw(
            params.to,
            out,
            params.target,
            RevertOptions({
                revertAddress: address(this),
                callOnRevert: true,
                abortAddress: address(0),
                revertMessage: abi.encode(context.sender, zrc20),
                onRevertGasLimit: 100000
            })
        );
    }

    function handleGasAndSwap(
        address inputToken,
        uint256 amount,
        address targetToken
    ) internal returns (uint256) {
        uint256 inputForGas;
        address gasZRC20;
        uint256 gasFee;
        uint256 swapAmount;

        (gasZRC20, gasFee) = IZRC20(targetToken).withdrawGasFee();

        if (gasZRC20 == inputToken) {
            swapAmount = amount - gasFee;
        } else {
            inputForGas = SwapHelperLib.swapTokensForExactTokens(
                uniswapRouter,
                inputToken,
                gasFee,
                gasZRC20,
                amount
            );
            swapAmount = amount - inputForGas;
        }

        uint256 outputAmount = SwapHelperLib.swapExactTokensForTokens(
            uniswapRouter,
            inputToken,
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
        return outputAmount;
    }

    function onRevert(RevertContext calldata context) external onlyGateway {
        (address sender, address zrc20) = abi.decode(
            context.revertMessage,
            (address, address)
        );
        uint256 outputAmount = handleGasAndSwap(
            context.asset,
            context.amount,
            zrc20
        );
        gateway.withdraw(
            abi.encodePacked(sender),
            outputAmount,
            zrc20,
            RevertOptions({
                revertAddress: sender,
                callOnRevert: false,
                abortAddress: address(0),
                revertMessage: "",
                onRevertGasLimit: 0
            })
        );
    }

    fallback() external payable {}

    receive() external payable {}
}
