// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@zetachain/protocol-contracts/contracts/evm/GatewayEVM.sol";
import {RevertContext} from "@zetachain/protocol-contracts/contracts/Revert.sol";
import {CallOptions} from "@zetachain/protocol-contracts/contracts/zevm/interfaces/IGatewayZEVM.sol";

contract Connected is Ownable {
    GatewayEVM public immutable gateway;
    uint256 private _nextTokenId;
    address public counterparty;
    event HelloEvent(string, string);
    event OnCallEvent(string, bytes);

    function setCounterparty(address contractAddress) external onlyOwner {
        counterparty = contractAddress;
    }

    modifier onlyGateway() {
        require(msg.sender == address(gateway), "Caller is not the gateway");
        _;
    }

    constructor(
        address payable gatewayAddress,
        address initialOwner
    ) Ownable(initialOwner) {
        gateway = GatewayEVM(gatewayAddress);
    }

    function transferCrossChain(
        bytes memory receiver,
        address destination,
        bytes memory encodedData,
        CallOptions memory callOptions,
        RevertOptions memory revertOptions
    ) external payable {
        bytes memory message = abi.encode(
            receiver,
            destination,
            encodedData,
            callOptions,
            revertOptions
        );
        gateway.depositAndCall{value: msg.value}(
            counterparty,
            message,
            revertOptions
        );
    }

    function hello(string memory message) external payable {
        emit HelloEvent("Event from hello()", message);
    }

    function onCall(
        MessageContext calldata messageContext,
        bytes calldata message
    ) external payable onlyGateway returns (bytes4) {
        emit OnCallEvent("Event from onCall()", message);
    }

    function onRevert(RevertContext calldata context) external onlyGateway {
        // (uint256 tokenId, address sender, string memory uri) = abi.decode(
        //     context.revertMessage,
        //     (uint256, address, string)
        // );
        // _safeMint(sender, tokenId);
        // _setTokenURI(tokenId, uri);
    }

    receive() external payable {}

    fallback() external payable {}
}
