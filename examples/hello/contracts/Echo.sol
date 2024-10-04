// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {RevertContext} from "@zetachain/protocol-contracts/contracts/Revert.sol";
import "@zetachain/protocol-contracts/contracts/evm/GatewayEVM.sol";

contract Echo {
    GatewayEVM public immutable gateway;

    event RevertEvent(string, RevertContext);
    event HelloEvent(string, string);

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

    function pingPong(string memory message) external payable {
        gateway.call(
            0xE6E340D132b5f46d1e472DebcD681B2aBc16e57E,
            abi.encode("hello"),
            RevertOptions({
                revertAddress: address(0),
                callOnRevert: false,
                abortAddress: address(0),
                revertMessage: "",
                onRevertGasLimit: 0
            })
        );
    }

    receive() external payable {}

    fallback() external payable {}
}
