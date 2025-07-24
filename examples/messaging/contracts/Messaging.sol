// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@zetachain/standard-contracts/contracts/messaging/contracts/Messaging.sol";

contract Example is Messaging {
    event OnMessageReceiveEvent(bytes);
    event OnMessageRevertEvent();
    event HelloEvent(string);
    event OnRevertEventEVM();

    constructor(
        address payable _gateway,
        address owner,
        address _router
    ) Messaging(_gateway, owner, _router) {}

    function onMessageReceive(
        bytes memory data,
        bytes memory sender,
        uint256 amount,
        bytes memory asset
    ) internal override {
        emit OnMessageReceiveEvent(data);
    }

    function onMessageRevert(
        bytes memory data,
        bytes memory sender,
        uint256 amount,
        bytes memory asset
    ) internal override {
        emit OnMessageRevertEvent();
        // Revert from destination chain
    }

    function onRevert(
        RevertContext calldata context
    ) external payable override onlyGateway {
        if (context.sender != router) revert Unauthorized();
        emit OnRevertEventEVM();
        // Revert from ZetaChain
    }

    function sendMessage(
        bytes memory receiver,
        address targetToken,
        bytes memory data,
        uint256 gasLimit,
        RevertOptions memory revertOptions
    ) external payable {
        bytes memory message = abi.encode(
            receiver,
            targetToken,
            data,
            gasLimit,
            revertOptions
        );
        gateway.depositAndCall{value: msg.value}(
            router,
            message,
            revertOptions
        );
    }

    function sendMessage(
        bytes memory receiver,
        address targetToken,
        uint256 amount,
        address asset,
        bytes memory data,
        uint256 gasLimit,
        RevertOptions memory revertOptions
    ) external {
        bytes memory message = abi.encode(
            receiver,
            targetToken,
            data,
            gasLimit,
            revertOptions
        );
        if (!IERC20(asset).transferFrom(msg.sender, address(this), amount)) {
            revert TransferFailed();
        }
        if (!IERC20(asset).approve(address(gateway), amount)) {
            revert ApprovalFailed();
        }

        gateway.depositAndCall(router, amount, asset, message, revertOptions);
    }
}
