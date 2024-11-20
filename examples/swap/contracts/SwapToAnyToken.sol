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

contract SwapToAnyToken is UniversalContract {
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

        swapAndWithdraw(
            zrc20,
            amount,
            params.target,
            params.to,
            params.withdraw
        );
    }

    function swapAndWithdraw(
        address inputToken,
        uint256 amount,
        address targetToken,
        bytes memory recipient,
        bool withdraw
    ) internal {
        uint256 inputForGas;
        address gasZRC20;
        uint256 gasFee;
        uint256 swapAmount = amount;

        if (withdraw) {
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
        }

        uint256 outputAmount = SwapHelperLib.swapExactTokensForTokens(
            uniswapRouter,
            inputToken,
            swapAmount,
            targetToken,
            0
        );

        if (withdraw) {
            if (gasZRC20 == targetToken) {
                IZRC20(gasZRC20).approve(
                    address(gateway),
                    outputAmount + gasFee
                );
            } else {
                IZRC20(gasZRC20).approve(address(gateway), gasFee);
                IZRC20(targetToken).approve(address(gateway), outputAmount);
            }
            gateway.withdraw(
                recipient,
                outputAmount,
                targetToken,
                RevertOptions({
                    revertAddress: address(0),
                    callOnRevert: false,
                    abortAddress: address(0),
                    revertMessage: "",
                    onRevertGasLimit: 0
                })
            );
        } else {
            IWETH9(targetToken).transfer(
                address(uint160(bytes20(recipient))),
                outputAmount
            );
        }
    }

    function swap(
        address inputToken,
        uint256 amount,
        address targetToken,
        bytes memory recipient,
        bool withdraw
    ) public {
        IZRC20(inputToken).transferFrom(msg.sender, address(this), amount);

        swapAndWithdraw(inputToken, amount, targetToken, recipient, withdraw);
    }

    function onRevert(
        RevertContext calldata revertContext
    ) external onlyGateway {}
}
