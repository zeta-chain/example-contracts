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
        // Revert from destination chain
    }

    function onRevert(
        RevertContext calldata context
    ) external payable override onlyGateway {
        if (context.sender != router) revert("Unauthorized");
        emit OnRevertEvent("Event from onRevert()", context);
        // Revert from ZetaChain
    }

    function sendMessage(
        address targetToken,
        bytes memory data,
        CallOptions memory callOptions,
        RevertOptions memory revertOptions
    ) external payable {
        bytes memory message = abi.encode(
            abi.encodePacked(counterparty),
            targetToken,
            data,
            callOptions,
            revertOptions
        );
        gateway.depositAndCall{value: msg.value}(
            router,
            message,
            revertOptions
        );
    }

    // function sendMessage(
    //     address targetToken,
    //     uint256 amount,
    //     address asset,
    //     bytes memory data,
    //     CallOptions memory callOptions,
    //     RevertOptions memory revertOptions
    // ) external {
    //     bytes memory message = abi.encode(
    //         abi.encodePacked(counterparty),
    //         targetToken,
    //         data,
    //         callOptions,
    //         revertOptions
    //     );
    //     if (!IERC20(asset).transferFrom(msg.sender, address(this), amount)) {
    //         revert TransferFailed();
    //     }
    //     if (!IERC20(asset).approve(address(gateway), amount)) {
    //         revert ApprovalFailed();
    //     }

    //     gateway.depositAndCall(router, amount, asset, message, revertOptions);
    // }
}
