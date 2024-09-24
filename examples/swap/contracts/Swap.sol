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
    SystemContract public systemContract;
    GatewayZEVM public gateway;
    uint256 constant BITCOIN = 18332;

    constructor(address systemContractAddress, address payable gatewayAddress) {
        systemContract = SystemContract(systemContractAddress);
        gateway = GatewayZEVM(gatewayAddress);
    }

    struct Params {
        address target;
        bytes to;
    }

    function onCrossChainCall(
        zContext calldata context,
        address zrc20,
        uint256 amount,
        bytes calldata message
    ) external override {
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

        swapAndWithdraw(zrc20, amount, params.target, params.to);
    }

    function swapAndWithdraw(
        address inputToken,
        uint256 amount,
        address targetToken,
        bytes memory recipient
    ) internal {
        uint256 inputForGas;
        address gasZRC20;
        uint256 gasFee;
        uint256 swapAmount;

        (gasZRC20, gasFee) = IZRC20(targetToken).withdrawGasFee();

        if (gasZRC20 == inputToken) {
            swapAmount = amount - gasFee;
        } else {
            inputForGas = SwapHelperLib.swapTokensForExactTokens(
                systemContract,
                inputToken,
                gasFee,
                gasZRC20,
                amount
            );
            swapAmount = amount - inputForGas;
        }

        uint256 outputAmount = SwapHelperLib.swapExactTokensForTokens(
            systemContract,
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
    }

    function onRevert(RevertContext calldata revertContext) external override {}
}
