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
    uint256 public immutable gasLimit;

    error InvalidAddress();
    error Unauthorized();
    error ApprovalFailed();

    modifier onlyGateway() {
        if (msg.sender != address(gateway)) revert Unauthorized();
        _;
    }

    constructor(
        address payable gatewayAddress,
        address uniswapRouterAddress,
        uint256 gasLimitAmount
    ) {
        if (gatewayAddress == address(0) || uniswapRouterAddress == address(0))
            revert InvalidAddress();
        uniswapRouter = uniswapRouterAddress;
        gateway = GatewayZEVM(gatewayAddress);
        gasLimit = gasLimitAmount;
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

        (uint256 out, address gasZRC20, uint256 gasFee) = handleGasAndSwap(
            zrc20,
            amount,
            params.target
        );
        withdraw(params, context.sender, gasFee, gasZRC20, out, zrc20);
    }

    function handleGasAndSwap(
        address inputToken,
        uint256 amount,
        address targetToken
    ) internal returns (uint256, address, uint256) {
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
        return (outputAmount, gasZRC20, gasFee);
    }

    function withdraw(
        Params memory params,
        address sender,
        uint256 gasFee,
        address gasZRC20,
        uint256 outputAmount,
        address inputToken
    ) public {
        if (gasZRC20 == params.target) {
            if (
                !IZRC20(gasZRC20).approve(
                    address(gateway),
                    outputAmount + gasFee
                )
            ) {
                revert ApprovalFailed();
            }
        } else {
            if (!IZRC20(gasZRC20).approve(address(gateway), gasFee)) {
                revert ApprovalFailed();
            }
            if (
                !IZRC20(params.target).approve(address(gateway), outputAmount)
            ) {
                revert ApprovalFailed();
            }
        }
        gateway.withdraw(
            params.to,
            outputAmount,
            params.target,
            RevertOptions({
                revertAddress: address(this),
                callOnRevert: true,
                abortAddress: address(0),
                revertMessage: abi.encode(sender, inputToken),
                onRevertGasLimit: gasLimit
            })
        );
    }

    function onRevert(RevertContext calldata context) external onlyGateway {
        (address sender, address zrc20) = abi.decode(
            context.revertMessage,
            (address, address)
        );
        (uint256 out, , ) = handleGasAndSwap(
            context.asset,
            context.amount,
            zrc20
        );
        gateway.withdraw(
            abi.encodePacked(sender),
            out,
            zrc20,
            RevertOptions({
                revertAddress: sender,
                callOnRevert: false,
                abortAddress: address(0),
                revertMessage: "",
                onRevertGasLimit: gasLimit
            })
        );
    }

    fallback() external payable {}

    receive() external payable {}
}
