// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {RevertContext} from "@zetachain/protocol-contracts/contracts/Revert.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/UniversalContract.sol";

contract Hello is UniversalContract {
    event ContextData(
        bytes origin,
        address sender,
        uint256 chainID,
        address msgSender,
        string message
    );

    event Foo(string message);

    event ContextDataRevert(RevertContext revertContext);

    function onCrossChainCall(
        zContext calldata context,
        address zrc20,
        uint256 amount,
        bytes calldata message
    ) external override {
        emit Foo("Hello from Hello contract");
        string memory decodedMessage;
        if (message.length > 0) {
            decodedMessage = abi.decode(message, (string));
        }
        emit ContextData(
            context.origin,
            context.sender,
            context.chainID,
            msg.sender,
            decodedMessage
        );
    }

    function onRevert(RevertContext calldata revertContext) external override {
        emit ContextDataRevert(revertContext);
    }

    receive() external payable {}

    fallback() external payable {}
}
