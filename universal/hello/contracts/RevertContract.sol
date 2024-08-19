// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {RevertContext} from "@zetachain/protocol-contracts/contracts/Revert.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/UniversalContract.sol";

contract RevertContract {
    event RevertEvent(string message);

    event ContextDataRevert(RevertContext revertContext);

    function onRevert(RevertContext calldata revertContext) external {
        emit ContextDataRevert(revertContext);
        // emit RevertEvent("Event from RevertContract!!!");
    }

    receive() external payable {}

    fallback() external payable {}
}
