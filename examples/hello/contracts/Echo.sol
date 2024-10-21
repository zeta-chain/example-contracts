// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {RevertContext} from "@zetachain/protocol-contracts/contracts/Revert.sol";
import "@zetachain/protocol-contracts/contracts/evm/GatewayEVM.sol";

contract Echo {
    GatewayEVM public immutable gateway;

    event RevertEvent(string, RevertContext);
    event HelloEvent(string, string);
    event ReceivedOnCall(address sender, bytes message);

    constructor(address payable gatewayAddress) {
        gateway = GatewayEVM(gatewayAddress);
    }

    function hello(string memory message) external payable {
        emit HelloEvent("Hello on EVM", message);
    }

    function onRevert(RevertContext calldata revertContext) external {
        emit RevertEvent("Revert on EVM", revertContext);
    }

    function call(
        address receiver,
        bytes calldata message,
        RevertOptions memory revertOptions
    ) external {
        gateway.call(receiver, message, revertOptions);
    }

    function onCall(
        MessageContext calldata messageContext,
        bytes calldata message
    ) external payable returns (bytes memory) {
        emit ReceivedOnCall(messageContext.sender, message);
        return "";
    }

    receive() external payable {}

    fallback() external payable {}
}
