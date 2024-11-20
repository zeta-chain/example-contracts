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
    address public router;

    event HelloEvent(string, string);
    event OnCallEvent(string);
    event OnRevertEvent(string, RevertContext);

    error Unauthorized();

    function setCounterparty(address contractAddress) external onlyOwner {
        counterparty = contractAddress;
    }

    function setRouter(address contractAddress) external onlyOwner {
        router = contractAddress;
    }

    modifier onlyGateway() {
        if (msg.sender != address(gateway)) revert Unauthorized();
        _;
    }

    constructor(
        address payable gatewayAddress,
        address initialOwner
    ) Ownable(initialOwner) {
        gateway = GatewayEVM(gatewayAddress);
    }

    function transferCrossChain(
        address destination,
        bytes memory data,
        CallOptions memory callOptions,
        RevertOptions memory revertOptions
    ) external payable {
        bytes memory message = abi.encode(
            abi.encodePacked(counterparty),
            destination,
            data,
            callOptions,
            revertOptions
        );
        gateway.depositAndCall{value: msg.value}(
            router,
            message,
            revertOptions
        );
    }

    function hello(string memory message) external payable {
        emit HelloEvent("Event from hello()", message);
    }

    function onCall(
        MessageContext calldata context,
        bytes calldata message
    ) external payable onlyGateway returns (bytes4) {
        if (context.sender != router) revert Unauthorized();
        (bytes memory data, address sender, bool isCall) = abi.decode(
            message,
            (bytes, address, bool)
        );

        if (sender != counterparty) revert Unauthorized();

        if (isCall) {
            // Handle a call from another connected chain
            emit OnCallEvent("regular call");
        } else {
            // Handle revert
            emit OnCallEvent("revert");
        }
        return "";
    }

    // onRevert is executed when router's onCall reverts
    function onRevert(
        RevertContext calldata context
    ) external payable onlyGateway {
        if (context.sender != router) revert("Unauthorized");
        emit OnRevertEvent("Event from onRevert()", context);
    }

    receive() external payable {}

    fallback() external payable {}

    function bytesToAddress(
        bytes memory b
    ) internal pure returns (address addr) {
        require(b.length == 20, "Invalid bytes length for address");
        assembly {
            addr := mload(add(b, 20))
        }
    }
}
