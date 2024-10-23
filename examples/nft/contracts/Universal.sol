// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import {RevertContext, RevertOptions} from "@zetachain/protocol-contracts/contracts/Revert.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/UniversalContract.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/IGatewayZEVM.sol";
import "@zetachain/protocol-contracts/contracts/zevm/GatewayZEVM.sol";

contract Universal is UniversalContract, ERC721Holder {
    GatewayZEVM public immutable gateway;

    struct Custody {
        address owner;
        address nftContract;
        uint256 tokenId;
    }

    mapping(address => Custody[]) public custody;

    event HelloEvent(string message, string name);
    event RevertEvent(string message, RevertContext context);
    event NFTLocked(address owner, address nftContract, uint256 tokenId);
    event GatewayCalled(address sender, uint256 tokenId, string message);

    error TransferFailed();

    constructor(address payable gatewayAddress) {
        gateway = GatewayZEVM(gatewayAddress);
    }

    function transferNFT(
        address nftContract,
        uint256 tokenId,
        bytes memory receiver,
        address zrc20,
        CallOptions memory callOptions,
        RevertOptions memory revertOptions
    ) external {
        address owner = IERC721(nftContract).ownerOf(tokenId);
        require(owner == msg.sender, "Caller is not the owner of the NFT");

        bool isApproved = IERC721(nftContract).getApproved(tokenId) ==
            address(this);
        require(isApproved, "Contract is not approved to transfer this NFT");

        IERC721(nftContract).safeTransferFrom(
            msg.sender,
            address(this),
            tokenId
        );

        custody[msg.sender].push(
            Custody({
                owner: msg.sender,
                nftContract: nftContract,
                tokenId: tokenId
            })
        );

        emit NFTLocked(msg.sender, nftContract, tokenId);

        (, uint256 gasFee) = IZRC20(zrc20).withdrawGasFeeWithGasLimit(
            callOptions.gasLimit
        );
        if (!IZRC20(zrc20).transferFrom(msg.sender, address(this), gasFee))
            revert TransferFailed();
        IZRC20(zrc20).approve(address(gateway), gasFee);

        gateway.call(
            receiver,
            zrc20,
            abi.encode("0x123"),
            callOptions,
            revertOptions
        );
    }

    function onCall(
        MessageContext calldata context,
        address zrc20,
        uint256 amount,
        bytes calldata message
    ) external override {
        string memory name = abi.decode(message, (string));
        emit HelloEvent("Hello on ZetaChain", name);
    }

    // Required override for ERC721Holder to accept safeTransferFrom
    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes memory data
    ) public override returns (bytes4) {
        return this.onERC721Received.selector;
    }
}
