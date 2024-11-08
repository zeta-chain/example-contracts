// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

contract Events {
    event SetCounterparty(address indexed newCounterparty);
    event TokenMinted(address indexed to, uint256 indexed tokenId, string uri);
    event TokenTransfer(
        address indexed destination,
        address indexed receiver,
        uint256 indexed tokenId,
        string uri
    );
    event TokenTransferReceived(
        address indexed receiver,
        uint256 indexed tokenId,
        string uri
    );
    event TokenTransferReverted(
        address indexed sender,
        uint256 indexed tokenId,
        string uri
    );
    event CounterpartySet(address indexed zrc20, bytes indexed contractAddress);
    event TokenTransferToDestination(
        address indexed destination,
        address indexed sender,
        uint256 indexed tokenId,
        string uri
    );
}
