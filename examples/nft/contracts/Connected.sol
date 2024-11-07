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

    error InvalidAddress();
    error Unauthorized();

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
        if (to == address(0)) revert InvalidAddress();

        uint256 tokenId = _nextTokenId++;

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
        bytes memory message = abi.encode(tokenId, receiver, uri, destination);

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

        emit TokenTransfer(tokenId, receiver, destination, uri);
    }

    function onCall(
        MessageContext calldata context,
        bytes calldata message
    ) external payable onlyGateway returns (bytes4) {
        if (context.sender != counterparty) revert Unauthorized();

        (uint256 tokenId, address receiver, string memory uri) = abi.decode(
            message,
            (uint256, address, string)
        );

        _safeMint(receiver, tokenId);
        _setTokenURI(tokenId, uri);
        emit TokenTransferReceived(tokenId, receiver, uri);
        return "";
    }

    function onRevert(RevertContext calldata context) external onlyGateway {
        (uint256 tokenId, address sender, string memory uri) = abi.decode(
            context.revertMessage,
            (uint256, address, string)
        );

        _safeMint(sender, tokenId);
        _setTokenURI(tokenId, uri);
        emit TokenTransferReverted(tokenId, sender, uri);
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
