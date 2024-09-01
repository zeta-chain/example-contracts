// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {RevertContext, RevertOptions} from "@zetachain/protocol-contracts/contracts/Revert.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/UniversalContract.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/IGatewayZEVM.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/IZRC20.sol";

contract Hello is UniversalContract {
    event HelloEvent(string, string);
    event ContextDataRevert(RevertContext);

    address constant gatewayAddress =
        0x610178dA211FEF7D417bC0e6FeD39F05609AD788;

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

    function call(
        bytes memory receiver,
        address zrc20,
        bytes calldata message,
        uint256 gasLimit,
        RevertOptions memory revertOptions
    ) external {
        IZRC20(zrc20).approve(gatewayAddress, 1_000_000_000);
        IGatewayZEVM(gatewayAddress).call(
            receiver,
            zrc20,
            message,
            gasLimit,
            revertOptions
        );
    }

    function onRevert(RevertContext calldata revertContext) external override {
        emit ContextDataRevert(revertContext);
    }
}
