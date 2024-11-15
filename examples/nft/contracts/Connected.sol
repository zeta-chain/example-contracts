// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@zetachain/protocol-contracts/contracts/evm/GatewayEVM.sol";
import {RevertContext} from "@zetachain/protocol-contracts/contracts/Revert.sol";
import "./shared/Events.sol";

contract Connected is
    ERC721,
    ERC721Enumerable,
    ERC721URIStorage,
    Ownable2Step,
    Events
{
    GatewayEVM public immutable gateway;
    uint256 private _nextTokenId;
    address public counterparty;

    error InvalidAddress();
    error Unauthorized();

    function setCounterparty(address contractAddress) external onlyOwner {
        if (contractAddress == address(0)) revert InvalidAddress();
        counterparty = contractAddress;
        emit SetCounterparty(contractAddress);
    }

    modifier onlyGateway() {
        if (msg.sender != address(gateway)) revert Unauthorized();
        _;
    }

    constructor(
        address payable gatewayAddress,
        address owner,
        string memory name,
        string memory symbol
    ) ERC721(name, symbol) Ownable(owner) {
        if (gatewayAddress == address(0) || owner == address(0))
            revert InvalidAddress();
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
        emit TokenMinted(to, tokenId, uri);
    }

    function transferCrossChain(
        uint256 tokenId,
        address receiver,
        address destination
    ) external payable {
        if (receiver == address(0)) revert InvalidAddress();

        string memory uri = tokenURI(tokenId);
        _burn(tokenId);
        bytes memory message = abi.encode(destination, receiver, tokenId, uri);

        RevertOptions memory revertOptions = RevertOptions(
            address(this),
            true,
            address(0),
            message,
            0
        );
        if (destination == address(0)) {
            gateway.call(counterparty, message, revertOptions);
        } else {
            gateway.depositAndCall{value: msg.value}(
                counterparty,
                message,
                revertOptions
            );
        }

        emit TokenTransfer(destination, receiver, tokenId, uri);
    }

    function onCall(
        MessageContext calldata context,
        bytes calldata message
    ) external payable onlyGateway returns (bytes4) {
        if (context.sender != counterparty) revert Unauthorized();

        (address receiver, uint256 tokenId, string memory uri) = abi.decode(
            message,
            (address, uint256, string)
        );

        _safeMint(receiver, tokenId);
        _setTokenURI(tokenId, uri);
        emit TokenTransferReceived(receiver, tokenId, uri);
        return "";
    }

    function onRevert(RevertContext calldata context) external onlyGateway {
        (address sender, uint256 tokenId, string memory uri) = abi.decode(
            context.revertMessage,
            (address, uint256, string)
        );

        _safeMint(sender, tokenId);
        _setTokenURI(tokenId, uri);
        emit TokenTransferReverted(sender, tokenId, uri);
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
