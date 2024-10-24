// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@zetachain/protocol-contracts/contracts/evm/GatewayEVM.sol";
import {RevertContext} from "@zetachain/protocol-contracts/contracts/Revert.sol";

contract Connected is ERC721, ERC721Enumerable, ERC721URIStorage, Ownable {
    GatewayEVM public immutable gateway;

    event RevertEvent(string, RevertContext);
    event HelloEvent(string, string);
    event ReceivedOnCall(
        address sender,
        address nftContract,
        uint256 tokenId,
        address originalSender
    );

    constructor(
        address payable gatewayAddress,
        address initialOwner
    ) ERC721("MyToken", "MTK") Ownable(initialOwner) {
        gateway = GatewayEVM(gatewayAddress);
    }

    function onRevert(RevertContext calldata revertContext) external {
        emit RevertEvent("Revert on EVM", revertContext);
    }

    function call(
        address receiver,
        bytes calldata message,
        RevertOptions memory revertOptions
    ) external {
        gateway.call(receiver, message, revertOptions);
    }

    function onCall(
        MessageContext calldata messageContext,
        bytes calldata message
    ) external payable {
        // Decode the message into the expected types
        // (uint256 tokenId, address originalSender) = abi.decode(
        //     message,
        //     (uint256, address)
        // );
        // _safeMint(originalSender, tokenId);
        // _setTokenURI(tokenId, uri);
    }

    receive() external payable {}

    fallback() external payable {}

    // The following functions are overrides required by Solidity.

    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721, ERC721Enumerable) returns (address) {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(
        address account,
        uint128 value
    ) internal override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, value);
    }

    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
