// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {RevertContext} from "@zetachain/protocol-contracts/contracts/Revert.sol";

contract Revert {
    event RevertEvent(string, RevertContext);
    event HelloEvent(string, string);

    function hello(string memory message) external {
        emit HelloEvent("Hello on EVM", message);
    }

    function onRevert(RevertContext calldata revertContext) external {
        emit RevertEvent("Revert on EVM", revertContext);
    }

    receive() external payable {}

    fallback() external payable {}
}
