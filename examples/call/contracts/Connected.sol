// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {RevertContext} from "@zetachain/protocol-contracts/contracts/Revert.sol";
import "@zetachain/protocol-contracts/contracts/evm/GatewayEVM.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract Connected {
    using SafeERC20 for IERC20;

    GatewayEVM public immutable gateway;

    event RevertEvent(string, RevertContext);
    event HelloEvent(string, string);

    error Unauthorized();

    modifier onlyGateway() {
        if (msg.sender != address(gateway)) revert Unauthorized();
        _;
    }

    constructor(address payable gatewayAddress) {
        gateway = GatewayEVM(gatewayAddress);
    }

    function call(
        address receiver,
        bytes calldata message,
        RevertOptions memory revertOptions
    ) external {
        gateway.call(receiver, message, revertOptions);
    }

    function deposit(
        address receiver,
        RevertOptions memory revertOptions
    ) external payable {
        gateway.deposit{value: msg.value}(receiver, revertOptions);
    }

    function deposit(
        address receiver,
        uint256 amount,
        address asset,
        RevertOptions memory revertOptions
    ) external {
        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);
        IERC20(asset).approve(address(gateway), amount);
        gateway.deposit(receiver, amount, asset, revertOptions);
    }

    function depositAndCall(
        address receiver,
        uint256 amount,
        address asset,
        bytes calldata message,
        RevertOptions memory revertOptions
    ) external {
        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);
        IERC20(asset).approve(address(gateway), amount);
        gateway.depositAndCall(receiver, amount, asset, message, revertOptions);
    }

    function depositAndCall(
        address receiver,
        bytes calldata message,
        RevertOptions memory revertOptions
    ) external payable {
        gateway.depositAndCall{value: msg.value}(
            receiver,
            message,
            revertOptions
        );
    }

    function hello(string memory message) external payable {
        emit HelloEvent("Hello on EVM", message);
    }

    function onCall(
        MessageContext calldata context,
        bytes calldata message
    ) external payable onlyGateway returns (bytes4) {
        string memory name = abi.decode(message, (string));
        emit HelloEvent("Hello on EVM from onCall()", name);
        return "";
    }

    function onRevert(
        RevertContext calldata revertContext
    ) external onlyGateway {
        emit RevertEvent("Revert on EVM", revertContext);
    }

    receive() external payable {}

    fallback() external payable {}
}
