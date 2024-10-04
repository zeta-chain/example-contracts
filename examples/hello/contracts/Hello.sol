// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {RevertContext, RevertOptions} from "@zetachain/protocol-contracts/contracts/Revert.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/UniversalContract.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/IGatewayZEVM.sol";
import "@zetachain/protocol-contracts/contracts/zevm/GatewayZEVM.sol";

contract Hello is UniversalContract {
    GatewayZEVM public immutable gateway;

    event HelloEvent(string, string);
    event RevertEvent(string, RevertContext);

    constructor(address payable gatewayAddress) {
        gateway = GatewayZEVM(gatewayAddress);
    }

    function onCrossChainCall(
        zContext calldata context,
        address zrc20,
        uint256 amount,
        bytes calldata message
    ) external override {
        string memory name = abi.decode(message, (string));
        emit HelloEvent("Hello on ZetaChain", name);
    }

    function onRevert(RevertContext calldata revertContext) external override {
        emit RevertEvent("Revert on ZetaChain", revertContext);
    }

    function call(
        bytes memory receiver,
        address zrc20,
        bytes calldata message,
        uint256 gasLimit,
        RevertOptions memory revertOptions
    ) external {
        (, uint256 gasFee) = IZRC20(zrc20).withdrawGasFeeWithGasLimit(gasLimit);
        IZRC20(zrc20).approve(address(gateway), gasFee);
        gateway.call(receiver, zrc20, message, gasLimit, revertOptions);
    }

    function withdrawAndCall(
        bytes memory receiver,
        uint256 amount,
        address zrc20,
        bytes calldata message,
        uint256 gasLimit,
        RevertOptions memory revertOptions
    ) external {
        (address gasZRC20, uint256 gasFee) = IZRC20(zrc20)
            .withdrawGasFeeWithGasLimit(gasLimit);
        if (zrc20 == gasZRC20) {
            IZRC20(zrc20).approve(address(gateway), amount + gasFee);
        } else {
            IZRC20(zrc20).approve(address(gateway), amount);
            IZRC20(gasZRC20).approve(address(gateway), gasFee);
        }
        gateway.withdrawAndCall(
            receiver,
            amount,
            zrc20,
            message,
            gasLimit,
            revertOptions
        );
    }
}
