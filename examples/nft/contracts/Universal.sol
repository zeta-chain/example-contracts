// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import {RevertContext, RevertOptions} from "@zetachain/protocol-contracts/contracts/Revert.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/UniversalContract.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/IGatewayZEVM.sol";
import "@zetachain/protocol-contracts/contracts/zevm/GatewayZEVM.sol";
import {SwapHelperLib} from "@zetachain/toolkit/contracts/SwapHelperLib.sol";
import {SystemContract} from "@zetachain/toolkit/contracts/SystemContract.sol";
import "./shared/Events.sol";

contract Universal is
    ERC721,
    ERC721Enumerable,
    ERC721URIStorage,
    Ownable2Step,
    UniversalContract,
    Events
{
    GatewayZEVM public immutable gateway;
    address public immutable uniswapRouter;
    uint256 private _nextTokenId;
    bool public isUniversal = true;
    uint256 public gasLimit;

    error TransferFailed();
    error Unauthorized();
    error InvalidAddress();
    error InvalidGasLimit();

    mapping(address => address) public counterparty;

    modifier onlyGateway() {
        if (msg.sender != address(gateway)) revert Unauthorized();
        _;
    }

    constructor(
        address payable gatewayAddress,
        address owner,
        string memory name,
        string memory symbol,
        uint256 gas,
        address uniswapRouterAddress
    ) ERC721(name, symbol) Ownable(owner) {
        if (
            gatewayAddress == address(0) ||
            owner == address(0) ||
            uniswapRouterAddress == address(0)
        ) revert InvalidAddress();
        if (gas == 0) revert InvalidGasLimit();
        gateway = GatewayZEVM(gatewayAddress);
        uniswapRouter = uniswapRouterAddress;
        gasLimit = gas;
    }

    function setCounterparty(
        address zrc20,
        address contractAddress
    ) external onlyOwner {
        counterparty[zrc20] = contractAddress;
        emit CounterpartySet(zrc20, contractAddress);
    }

    function transferCrossChain(
        uint256 tokenId,
        address receiver,
        address destination
    ) public {
        if (receiver == address(0)) revert InvalidAddress();
        string memory uri = tokenURI(tokenId);
        _burn(tokenId);

        (, uint256 gasFee) = IZRC20(destination).withdrawGasFeeWithGasLimit(
            gasLimit
        );
        if (
            !IZRC20(destination).transferFrom(msg.sender, address(this), gasFee)
        ) revert TransferFailed();
        IZRC20(destination).approve(address(gateway), gasFee);
        bytes memory message = abi.encode(
            receiver,
            tokenId,
            uri,
            0,
            msg.sender
        );

        CallOptions memory callOptions = CallOptions(gasLimit, false);

        RevertOptions memory revertOptions = RevertOptions(
            address(this),
            true,
            address(0),
            message,
            gasLimit
        );

        gateway.call(
            abi.encodePacked(counterparty[destination]),
            destination,
            message,
            callOptions,
            revertOptions
        );

        emit TokenTransfer(receiver, destination, tokenId, uri);
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
        if (context.sender != counterparty[zrc20]) revert Unauthorized();

        (
            address destination,
            address receiver,
            uint256 tokenId,
            string memory uri,
            address sender
        ) = abi.decode(message, (address, address, uint256, string, address));

        if (destination == address(0)) {
            _safeMint(receiver, tokenId);
            _setTokenURI(tokenId, uri);
            emit TokenTransferReceived(receiver, tokenId, uri);
        } else {
            (, uint256 gasFee) = IZRC20(destination).withdrawGasFeeWithGasLimit(
                gasLimit
            );

            uint256 out = SwapHelperLib.swapExactTokensForTokens(
                uniswapRouter,
                zrc20,
                amount,
                destination,
                0
            );

            IZRC20(destination).approve(address(gateway), out);
            gateway.withdrawAndCall(
                abi.encodePacked(counterparty[destination]),
                out - gasFee,
                destination,
                abi.encode(receiver, tokenId, uri, out - gasFee, sender),
                CallOptions(gasLimit, false),
                RevertOptions(address(0), false, address(0), "", 0)
            );
        }
        emit TokenTransferToDestination(receiver, destination, tokenId, uri);
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
