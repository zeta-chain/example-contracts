// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {RevertContext, RevertOptions} from "@zetachain/protocol-contracts/contracts/Revert.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/UniversalContract.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/IGatewayZEVM.sol";
import "@zetachain/protocol-contracts/contracts/zevm/GatewayZEVM.sol";

contract Universal is UniversalContract {
    GatewayZEVM public immutable gateway;

    event HelloEvent(string, string);
    event RevertEvent(string, RevertContext);
    error TransferFailed();

    modifier onlyGateway() {
        require(msg.sender == address(gateway), "Caller is not the gateway");
        _;
    }

    constructor(address payable gatewayAddress) {
        gateway = GatewayZEVM(gatewayAddress);
    }

    function onCall(
        MessageContext calldata context,
        address zrc20,
        uint256 amount,
        bytes calldata message
    ) external override onlyGateway {
        string memory name = abi.decode(message, (string));
        emit HelloEvent("Hello on ZetaChain", name);
    }

    function onRevert(
        RevertContext calldata revertContext
    ) external onlyGateway {
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
        if (!IZRC20(zrc20).transferFrom(msg.sender, address(this), gasFee))
            revert TransferFailed();
        IZRC20(zrc20).approve(address(gateway), gasFee);
        CallOptions memory callOptions = CallOptions(gasLimit, true);
        gateway.call(receiver, zrc20, message, callOptions, revertOptions);
    }

    function withdraw(
        bytes memory receiver,
        uint256 amount,
        address zrc20,
        RevertOptions memory revertOptions
    ) external {
        (address gasZRC20, uint256 gasFee) = IZRC20(zrc20).withdrawGasFee();
        uint256 target = zrc20 == gasZRC20 ? amount + gasFee : amount;
        if (!IZRC20(zrc20).transferFrom(msg.sender, address(this), target))
            revert TransferFailed();
        IZRC20(zrc20).approve(address(gateway), target);
        if (zrc20 != gasZRC20) {
            if (
                !IZRC20(gasZRC20).transferFrom(
                    msg.sender,
                    address(this),
                    gasFee
                )
            ) revert TransferFailed();
            IZRC20(gasZRC20).approve(address(gateway), gasFee);
        }
        gateway.withdraw(receiver, amount, zrc20, revertOptions);
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
        uint256 target = zrc20 == gasZRC20 ? amount + gasFee : amount;
        if (!IZRC20(zrc20).transferFrom(msg.sender, address(this), target))
            revert TransferFailed();
        IZRC20(zrc20).approve(address(gateway), target);
        if (zrc20 != gasZRC20) {
            if (
                !IZRC20(gasZRC20).transferFrom(
                    msg.sender,
                    address(this),
                    gasFee
                )
            ) revert TransferFailed();
            IZRC20(gasZRC20).approve(address(gateway), gasFee);
        }
        CallOptions memory callOptions = CallOptions(gasLimit, false);
        gateway.withdrawAndCall(
            receiver,
            amount,
            zrc20,
            message,
            callOptions,
            revertOptions
        );
    }
}
