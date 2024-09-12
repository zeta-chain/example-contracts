// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {RevertContext, RevertOptions} from "@zetachain/protocol-contracts/contracts/Revert.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/UniversalContract.sol";

contract Hello is UniversalContract {
    event HelloEvent(string, string);
    event ContextDataRevert(RevertContext);

    address constant gatewayAddress =
        0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0;

    function onCrossChainCall(
        zContext calldata context,
        address zrc20,
        uint256 amount,
        bytes calldata message
    ) external override {
        string memory decodedMessage;
        if (message.length > 0) {
            decodedMessage = abi.decode(message, (string));
        }
        emit HelloEvent("Hello from a universal app", decodedMessage);
    }

    function onRevert(RevertContext calldata revertContext) external override {
        emit ContextDataRevert(revertContext);
    }
}
