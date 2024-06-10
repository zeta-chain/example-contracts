// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract MyNFT is ERC721 {
    uint256 private _currentTokenId = 0;

    constructor() ERC721("MyNFT", "MNFT") {}

    function mintTo(address recipient) public returns (uint256) {
        uint256 newTokenId = _currentTokenId;
        _currentTokenId += 1;
        _mint(recipient, newTokenId);
        return newTokenId;
    }
}
