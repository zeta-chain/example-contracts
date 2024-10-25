// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import {RevertContext, RevertOptions} from "@zetachain/protocol-contracts/contracts/Revert.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/UniversalContract.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/IGatewayZEVM.sol";
import "@zetachain/protocol-contracts/contracts/zevm/GatewayZEVM.sol";

contract Universal is
    ERC721,
    ERC721Enumerable,
    ERC721URIStorage,
    Ownable,
    UniversalContract
{
    uint256 private _nextTokenId;
    uint256 public chainLabel;
    GatewayZEVM public immutable gateway;
    error TransferFailed();

    mapping(address => bytes) public counterparty;

    event CounterpartySet(address indexed zrc20, bytes indexed contractAddress);

    constructor(
        address payable gatewayAddress,
        address initialOwner,
        uint256 label
    ) ERC721("MyToken", "MTK") Ownable(initialOwner) {
        gateway = GatewayZEVM(gatewayAddress);
        chainLabel = label;
    }

    function setCounterparty(
        address zrc20,
        bytes memory contractAddress
    ) external onlyOwner {
        counterparty[zrc20] = contractAddress;
        emit CounterpartySet(zrc20, contractAddress);
    }

    function transfer(
        uint256 tokenId,
        bytes memory receiver,
        address zrc20,
        CallOptions memory callOptions,
        RevertOptions memory revertOptions
    ) external {
        string memory uri = tokenURI(tokenId);
        _burn(tokenId);

        (, uint256 gasFee) = IZRC20(zrc20).withdrawGasFeeWithGasLimit(
            callOptions.gasLimit
        );
        if (!IZRC20(zrc20).transferFrom(msg.sender, address(this), gasFee))
            revert TransferFailed();
        IZRC20(zrc20).approve(address(gateway), gasFee);
        bytes memory encodedData = abi.encode(tokenId, msg.sender, uri);

        gateway.call(receiver, zrc20, encodedData, callOptions, revertOptions);
    }

    function safeMint(address to, string memory uri) public onlyOwner {
        uint256 hash = uint256(
            keccak256(abi.encodePacked(chainLabel, _nextTokenId++))
        );

        uint256 tokenId = hash & 0x00FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF;

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }

    function onCall(
        MessageContext calldata messageContext,
        address zrc20,
        uint256 amount,
        bytes calldata message
    ) external override {
        if (keccak256(messageContext.origin) != keccak256(counterparty[zrc20]))
            revert("Unauthorized");
        (uint256 tokenId, address sender, string memory uri) = abi.decode(
            message,
            (uint256, address, string)
        );
        _safeMint(sender, tokenId);
        _setTokenURI(tokenId, uri);
    }

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
