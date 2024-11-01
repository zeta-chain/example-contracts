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
    uint256 private _nextTokenId;
    address public counterparty;

    function setCounterparty(address contractAddress) external onlyOwner {
        counterparty = contractAddress;
    }

    constructor(
        address payable gatewayAddress,
        address initialOwner
    ) ERC721("MyToken", "MTK") Ownable(initialOwner) {
        gateway = GatewayEVM(gatewayAddress);
    }

    function safeMint(address to, string memory uri) public onlyOwner {
        uint256 hash = uint256(
            keccak256(
                abi.encodePacked(address(this), block.number, _nextTokenId++)
            )
        );

        uint256 tokenId = hash & 0x00FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF;

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }

    function transferCrossChain(
        uint256 tokenId,
        address receiver,
        address destination
    ) external payable {
        string memory uri = tokenURI(tokenId);
        _burn(tokenId);
        bytes memory encodedData = abi.encode(
            tokenId,
            receiver,
            uri,
            destination
        );

        RevertOptions memory revertOptions = RevertOptions(
            address(this),
            true,
            address(0),
            encodedData,
            0
        );

        if (destination == address(0)) {
            gateway.call(counterparty, encodedData, revertOptions);
        } else {
            gateway.depositAndCall{value: msg.value}(
                counterparty,
                encodedData,
                revertOptions
            );
        }
    }

    function onCall(
        MessageContext calldata messageContext,
        bytes calldata message
    ) external payable returns (bytes4) {
        if (messageContext.sender != counterparty) revert("Unauthorized");

        (uint256 tokenId, address receiver, string memory uri) = abi.decode(
            message,
            (uint256, address, string)
        );
        _safeMint(receiver, tokenId);
        _setTokenURI(tokenId, uri);
        return "";
    }

    function onRevert(RevertContext calldata context) external {
        (uint256 tokenId, address sender, string memory uri) = abi.decode(
            context.revertMessage,
            (uint256, address, string)
        );

        _safeMint(sender, tokenId);
        _setTokenURI(tokenId, uri);
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
