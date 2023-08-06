// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@zetachain/protocol-contracts/contracts/zevm/SystemContract.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/zContract.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Minter is zContract, ERC20 {
    error WrongChain();

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
    ) external virtual override {
        address recipient = abi.decode(message, (address));
        address acceptedZRC20 = systemContract.gasCoinZRC20ByChainId(chain);
        if (zrc20 != acceptedZRC20) revert WrongChain();

        _mint(recipient, amount);
    }
}
