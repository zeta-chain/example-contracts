// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {RevertContext} from "@zetachain/protocol-contracts/contracts/Revert.sol";
import "@zetachain/protocol-contracts/contracts/evm/GatewayEVM.sol";

contract Connected {
    GatewayEVM public immutable gateway;

    event RevertEvent(string, RevertContext);
    event HelloEvent(string, string);

    modifier onlyGateway() {
        require(msg.sender == address(gateway), "Caller is not the gateway");
        _;
    }

    constructor(address payable gatewayAddress) {
        gateway = GatewayEVM(gatewayAddress);
    }

    function deposit(
        address receiver,
        RevertOptions memory revertOptions
    ) external payable {
        gateway.deposit{value: msg.value}(receiver, revertOptions);
    }

    function call(
        address receiver,
        bytes calldata message,
        RevertOptions memory revertOptions
    ) external {
        gateway.call(receiver, message, revertOptions);
    }

    function depositAndCall(
        address receiver,
        bytes calldata message,
        RevertOptions memory revertOptions
    ) external payable {
        gateway.depositAndCall{value: msg.value}(
            receiver,
            message,
            revertOptions
        );
    }

    function hello(string memory message) external payable {
        emit HelloEvent("Hello on EVM", message);
    }

    function onCall(
        MessageContext calldata context,
        bytes calldata message
    ) external payable onlyGateway {
        emit HelloEvent("Hello on EVM from onCall()", "hey");
    }

    function onRevert(
        RevertContext calldata revertContext
    ) external onlyGateway {
        emit RevertEvent("Revert on EVM", revertContext);
    }

    receive() external payable {}

    fallback() external payable {}
}
