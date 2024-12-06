// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {SystemContract, IZRC20} from "@zetachain/toolkit/contracts/SystemContract.sol";
import {SwapHelperLib} from "@zetachain/toolkit/contracts/SwapHelperLib.sol";
import {BytesHelperLib} from "@zetachain/toolkit/contracts/BytesHelperLib.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {RevertContext, RevertOptions} from "@zetachain/protocol-contracts/contracts/Revert.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/UniversalContract.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/IGatewayZEVM.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/IWZETA.sol";
import {GatewayZEVM} from "@zetachain/protocol-contracts/contracts/zevm/GatewayZEVM.sol";

contract Swap is UniversalContract {
    address public immutable uniswapRouter;
    GatewayZEVM public gateway;
    uint256 constant BITCOIN = 18332;
    uint256 public immutable gasLimit;

    error InvalidAddress();
    error Unauthorized();
    error ApprovalFailed();
    error TransferFailed();

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
        bool withdraw;
    }

    function onCall(
        MessageContext calldata context,
        address zrc20,
        uint256 amount,
        bytes calldata message
    ) external onlyGateway {
        Params memory params = Params({
            target: address(0),
            to: bytes(""),
            withdraw: true
        });

        if (context.chainID == BITCOIN) {
            params.target = BytesHelperLib.bytesToAddress(message, 0);
            params.to = abi.encodePacked(
                BytesHelperLib.bytesToAddress(message, 20)
            );
            if (message.length >= 41) {
                params.withdraw = BytesHelperLib.bytesToBool(message, 40);
            }
        } else {
            (
                address targetToken,
                bytes memory recipient,
                bool withdrawFlag
            ) = abi.decode(message, (address, bytes, bool));
            params.target = targetToken;
            params.to = recipient;
            params.withdraw = withdrawFlag;
        }

        (uint256 out, address gasZRC20, uint256 gasFee) = handleGasAndSwap(
            zrc20,
            amount,
            params.target
        );
        withdraw(params, context.sender, gasFee, gasZRC20, out, zrc20);
    }

    function swap(
        address inputToken,
        uint256 amount,
        address targetToken,
        bytes memory recipient,
        bool withdrawFlag
    ) public {
        bool success = IZRC20(inputToken).transferFrom(
            msg.sender,
            address(this),
            amount
        );
        if (!success) {
            revert TransferFailed();
        }

        (uint256 out, address gasZRC20, uint256 gasFee) = handleGasAndSwap(
            inputToken,
            amount,
            targetToken
        );

        withdraw(
            Params({
                target: targetToken,
                to: recipient,
                withdraw: withdrawFlag
            }),
            msg.sender,
            gasFee,
            gasZRC20,
            out,
            inputToken
        );
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

        uint256 out = SwapHelperLib.swapExactTokensForTokens(
            uniswapRouter,
            inputToken,
            swapAmount,
            targetToken,
            0
        );
        return (out, gasZRC20, gasFee);
    }

    function withdraw(
        Params memory params,
        address sender,
        uint256 gasFee,
        address gasZRC20,
        uint256 out,
        address inputToken
    ) public {
        if (params.withdraw) {
            if (gasZRC20 == params.target) {
                if (!IZRC20(gasZRC20).approve(address(gateway), out + gasFee)) {
                    revert ApprovalFailed();
                }
            } else {
                if (!IZRC20(gasZRC20).approve(address(gateway), gasFee)) {
                    revert ApprovalFailed();
                }
                if (!IZRC20(params.target).approve(address(gateway), out)) {
                    revert ApprovalFailed();
                }
            }
            gateway.withdraw(
                abi.encodePacked(params.to),
                out,
                params.target,
                RevertOptions({
                    revertAddress: address(this),
                    callOnRevert: true,
                    abortAddress: address(0),
                    revertMessage: abi.encode(sender, inputToken),
                    onRevertGasLimit: gasLimit
                })
            );
        } else {
            bool success = IWETH9(params.target).transfer(
                address(uint160(bytes20(params.to))),
                out
            );
            if (!success) {
                revert TransferFailed();
            }
        }
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
