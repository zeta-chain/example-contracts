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

    function hello(string memory message) external payable {
        emit HelloEvent("Hello on EVM", message);
    }

    function onRevert(
        RevertContext calldata revertContext
    ) external onlyGateway {
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
        MessageContext calldata context,
        bytes calldata message
    ) external payable onlyGateway returns (bytes4) {
        emit HelloEvent("Hello on EVM from onCall()", "hey");

        return "";
    }

    receive() external payable {}

    fallback() external payable {}
}