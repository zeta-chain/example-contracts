// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {UniversalRouter as UniversalRouterImport} from "@zetachain/standard-contracts/contracts/messaging/contracts/UniversalRouter.sol";

contract UniversalRouter is UniversalRouterImport {
    constructor(address owner) UniversalRouterImport(owner) {}
}
