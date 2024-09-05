// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";

library Math {
    using SafeMath for uint256;

    error AdditionsOverflow();
    error SubtractionsUnderflow();
    error MultiplicationsOverflow();

    function add(uint256 x, uint256 y) internal pure returns (uint256 z) {
        bool success;
        (success, z) = x.tryAdd(y);
        if (!success) revert AdditionsOverflow();
    }

    function sub(uint256 x, uint256 y) internal pure returns (uint256 z) {
        bool success;
        (success, z) = x.trySub(y);
        if (!success) revert SubtractionsUnderflow();
    }

    function mul(uint256 x, uint256 y) internal pure returns (uint256 z) {
        bool success;
        (success, z) = x.tryMul(y);
        if (!success) revert MultiplicationsOverflow();
    }
}
