// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/zContract.sol";
import "@zetachain/toolkit/contracts/BytesHelperLib.sol";
import "@zetachain/protocol-contracts/contracts/zevm/SystemContract.sol";

interface MinterErrors {
    error WrongChain();
}

contract Minter is ERC20, zContract, MinterErrors {
    SystemContract public immutable systemContract;
    uint256 public immutable chain;

    constructor(
        string memory name,
        string memory symbol,
        uint256 chainID,
        address systemContractAddress
    ) ERC20(name, symbol) {
        systemContract = SystemContract(systemContractAddress);
        chain = chainID;
    }

    function onCrossChainCall(
        address zrc20,
        uint256 amount,
        bytes calldata message
    ) external override {
        address acceptedZRC20 = systemContract.gasCoinZRC20ByChainId(chain);
        if (zrc20 != acceptedZRC20) revert WrongChain();

        address recipient = BytesHelperLib.bytesToAddress(message, 0);

        _mint(recipient, amount);
    }
}
