// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";

contract Mock4626 is ERC4626 {
    constructor(
        IERC20 _asset
    ) ERC20("Mock ERC4626 Vault", "m4626") ERC4626(_asset) {}
}
