// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@zetachain/protocol-contracts/contracts/evm/GatewayEVM.sol";
import {RevertContext} from "@zetachain/protocol-contracts/contracts/Revert.sol";
import {CallOptions} from "@zetachain/protocol-contracts/contracts/zevm/interfaces/IGatewayZEVM.sol";

contract ConnectedRouter is Ownable {
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

    modifier onlyGateway() {
        if (msg.sender != address(gateway)) revert Unauthorized();
        _;
    }

    constructor(
        address payable gatewayAddress,
        address ownerAddress,
        address routerAddress
    ) Ownable(ownerAddress) {
        gateway = GatewayEVM(gatewayAddress);
        router = routerAddress;
    }

    function gatewaySendMessage(
        address targetToken,
        bytes memory data,
        CallOptions memory callOptions,
        RevertOptions memory revertOptions
    ) public payable {
        bytes memory message = abi.encode(
            abi.encodePacked(counterparty),
            targetToken,
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

    function onCall(
        MessageContext calldata context,
        bytes calldata message
    ) external payable onlyGateway returns (bytes4) {
        if (context.sender != router) revert Unauthorized();
        (bytes memory data, address sender, uint256 amount, bool isCall) = abi
            .decode(message, (bytes, address, uint256, bool));

        if (sender != counterparty) revert Unauthorized();

        if (isCall) {
            onMessageReceive(data, sender, amount);
        } else {
            onMessageRevert(data, sender, amount);
        }
        return "";
    }

    // onRevert is executed when router's onCall reverts
    function onRevert(
        RevertContext calldata context
    ) external payable virtual onlyGateway {
        if (context.sender != router) revert("Unauthorized");
        emit OnRevertEvent("Event from onRevert()", context);
    }

    function onMessageReceive(
        bytes memory data,
        address sender,
        uint256 amount
    ) internal virtual {
        // To be overridden in the child contract
    }

    function onMessageRevert(
        bytes memory data,
        address sender,
        uint256 amount
    ) internal virtual {
        // To be overridden in the child contract
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
