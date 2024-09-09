// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "./shared/SystemContract.sol";
import "./shared/SwapHelperLib.sol";
import "./shared/BytesHelperLib.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./shared/libraries/UniswapV2Library.sol";

import {RevertContext, RevertOptions} from "@zetachain/protocol-contracts/contracts/Revert.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/UniversalContract.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/IGatewayZEVM.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/IWZETA.sol";

contract SwapToAnyToken is UniversalContract {
    SystemContract public systemContract;
    uint256 constant BITCOIN = 18332;
    address constant gatewayAddress =
        0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0;

    constructor(address systemContractAddress) {
        systemContract = SystemContract(systemContractAddress);
    }

    struct Params {
        address target;
        bytes to;
        bool withdraw;
    }

    function onCrossChainCall(
        zContext calldata context,
        address zrc20,
        uint256 amount,
        bytes calldata message
    ) external virtual override {
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

        uint256 inputForGas;
        address gasZRC20;
        uint256 gasFee;
        uint256 swapAmount;

        if (params.withdraw) {
            (gasZRC20, gasFee) = IZRC20(params.target).withdrawGasFee();

            if (gasZRC20 == zrc20) {
                swapAmount = amount - gasFee;
            } else {
                inputForGas = SwapHelperLib.swapTokensForExactTokens(
                    systemContract,
                    zrc20,
                    gasFee,
                    gasZRC20,
                    amount
                );
                swapAmount = amount - inputForGas;
            }
        }

        uint256 outputAmount = SwapHelperLib.swapExactTokensForTokens(
            systemContract,
            zrc20,
            swapAmount,
            params.target,
            0
        );

        if (params.withdraw) {
            if (gasZRC20 == params.target) {
                IZRC20(gasZRC20).approve(gatewayAddress, outputAmount + gasFee);
            } else {
                IZRC20(gasZRC20).approve(gatewayAddress, gasFee);
                IZRC20(params.target).approve(gatewayAddress, outputAmount);
            }
            IGatewayZEVM(gatewayAddress).withdraw(
                params.to,
                outputAmount,
                params.target,
                RevertOptions({
                    revertAddress: address(0),
                    callOnRevert: false,
                    abortAddress: address(0),
                    revertMessage: "",
                    onRevertGasLimit: 0
                })
            );
        } else {
            IWETH9(params.target).transfer(
                address(uint160(bytes20(params.to))),
                outputAmount
            );
        }
    }

    function onRevert(RevertContext calldata revertContext) external override {}
}
