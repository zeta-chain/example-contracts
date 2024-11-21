// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "./ConnectedRouter.sol";

contract Connected is ConnectedRouter {
    event OnMessageReceiveEvent();
    event OnMessageRevertEvent();

    constructor(
        address payable gateway,
        address owner,
        address router
    ) ConnectedRouter(gateway, owner, router) {}

    function onMessageReceive(
        bytes memory data,
        address sender,
        uint256 amount
    ) internal override {
        emit OnMessageReceiveEvent();
    }

    function onMessageRevert(
        bytes memory data,
        address sender,
        uint256 amount
    ) internal override {
        emit OnMessageRevertEvent();
    }

    function sendMessage(
        address destination,
        bytes memory data,
        CallOptions memory callOptions,
        RevertOptions memory revertOptions
    ) external payable {
        gatewaySendMessage(destination, data, callOptions, revertOptions);
    }
}
