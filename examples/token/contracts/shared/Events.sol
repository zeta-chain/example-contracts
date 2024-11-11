// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

contract Events {
    event CounterpartyMappingSet(
        address indexed zrc20,
        bytes indexed contractAddress
    );
    event CounterpartySet(address indexed contractAddress);

    event TokenMinted(address indexed to, uint256 amount);
    event TokenTransfer(
        address indexed destination,
        address indexed receiver,
        uint256 amount
    );
    event TokenTransferReceived(address indexed receiver, uint256 amount);
    event TokenTransferReverted(address indexed sender, uint256 amount);
    event TokenTransferToDestination(
        address indexed destination,
        address indexed sender,
        uint256 amount
    );
}
