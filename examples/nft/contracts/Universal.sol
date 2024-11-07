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
import {SwapHelperLib} from "@zetachain/toolkit/contracts/SwapHelperLib.sol";
import {SystemContract} from "@zetachain/toolkit/contracts/SystemContract.sol";

contract Universal is
    ERC721,
    ERC721Enumerable,
    ERC721URIStorage,
    Ownable,
    UniversalContract
{
    GatewayZEVM public immutable gateway;
    SystemContract public immutable systemContract =
        SystemContract(0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9);
    uint256 private _nextTokenId;
    bool public isUniversal = true;
    uint256 public gasLimit = 700000;

    error TransferFailed();

    mapping(address => bytes) public counterparty;

    event CounterpartySet(address indexed zrc20, bytes indexed contractAddress);

    modifier onlyGateway() {
        require(msg.sender == address(gateway), "Caller is not the gateway");
        _;
    }

    constructor(
        address payable gatewayAddress,
        address owner,
        string memory name,
        string memory symbol
    ) ERC721(name, symbol) Ownable(owner) {
        gateway = GatewayZEVM(gatewayAddress);
    }

    function setCounterparty(
        address zrc20,
        bytes memory contractAddress
    ) external onlyOwner {
        counterparty[zrc20] = contractAddress;
        emit CounterpartySet(zrc20, contractAddress);
    }

    function transferCrossChain(
        uint256 tokenId,
        address receiver,
        address destination
    ) public {
        string memory uri = tokenURI(tokenId);
        _burn(tokenId);

        (, uint256 gasFee) = IZRC20(destination).withdrawGasFeeWithGasLimit(
            gasLimit
        );
        if (
            !IZRC20(destination).transferFrom(msg.sender, address(this), gasFee)
        ) revert TransferFailed();
        IZRC20(destination).approve(address(gateway), gasFee);
        bytes memory message = abi.encode(tokenId, receiver, uri);

        CallOptions memory callOptions = CallOptions(gasLimit, false);

        RevertOptions memory revertOptions = RevertOptions(
            address(this),
            true,
            address(0),
            message,
            gasLimit
        );

        gateway.call(
            counterparty[destination],
            destination,
            message,
            callOptions,
            revertOptions
        );
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

    function onCall(
        MessageContext calldata context,
        address zrc20,
        uint256 amount,
        bytes calldata message
    ) external override onlyGateway {
        if (keccak256(context.origin) != keccak256(counterparty[zrc20]))
            revert("Unauthorized");

        (
            uint256 tokenId,
            address sender,
            string memory uri,
            address destination
        ) = abi.decode(message, (uint256, address, string, address));

        if (destination == address(0)) {
            _safeMint(sender, tokenId);
            _setTokenURI(tokenId, uri);
        } else {
            (, uint256 gasFee) = IZRC20(destination).withdrawGasFeeWithGasLimit(
                700000
            );

            SwapHelperLib.swapExactTokensForTokens(
                systemContract,
                zrc20,
                amount,
                destination,
                0
            );

            IZRC20(destination).approve(address(gateway), gasFee);
            gateway.call(
                counterparty[destination],
                destination,
                abi.encode(tokenId, sender, uri),
                CallOptions(700000, false),
                RevertOptions(address(0), false, address(0), "", 0)
            );
        }
    }

    function onRevert(RevertContext calldata context) external onlyGateway {
        (uint256 tokenId, address sender, string memory uri) = abi.decode(
            context.revertMessage,
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
