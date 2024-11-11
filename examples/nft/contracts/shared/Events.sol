// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

contract Events {
    event SetCounterparty(address indexed newCounterparty);
    event TokenMinted(address indexed to, uint256 indexed tokenId, string uri);
    event TokenTransfer(
        uint256 indexed tokenId,
        address indexed receiver,
        address indexed destination,
        string uri
    );
    event TokenTransferReceived(
        uint256 indexed tokenId,
        address indexed receiver,
        string uri
    );
    event TokenTransferReverted(
        uint256 indexed tokenId,
        address indexed sender,
        string uri
    );
    event CounterpartySet(address indexed zrc20, address contractAddress);
    event TokenTransferToDestination(
        uint256 indexed tokenId,
        address indexed sender,
        address indexed destination,
        string uri
    );
}
