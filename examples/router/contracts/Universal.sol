// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {RevertContext, RevertOptions} from "@zetachain/protocol-contracts/contracts/Revert.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/UniversalContract.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/IGatewayZEVM.sol";
import "@zetachain/protocol-contracts/contracts/zevm/GatewayZEVM.sol";
import {SwapHelperLib} from "@zetachain/toolkit/contracts/SwapHelperLib.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Universal is UniversalContract, Ownable {
    GatewayZEVM public immutable gateway;
    address public immutable uniswapRouter;
    bool public isUniversal = true;

    error TransferFailed();
    error InsufficientOutAmount(uint256 out, uint256 gasFee);
    error Unauthorized();
    error InvalidAddress();

    mapping(address => bytes) public counterparty;

    event CounterpartySet(address indexed zrc20, bytes indexed contractAddress);
    event GasFeeAndOut(uint256 gasFee, uint256 out);
    event RevertEvent(string);

    event Data(bytes);

    modifier onlyGateway() {
        if (msg.sender != address(gateway)) revert Unauthorized();
        _;
    }

    constructor(
        address payable gatewayAddress,
        address owner,
        address uniswapRouterAddress
    ) Ownable(owner) {
        if (
            gatewayAddress == address(0) ||
            owner == address(0) ||
            uniswapRouterAddress == address(0)
        ) revert InvalidAddress();
        gateway = GatewayZEVM(gatewayAddress);
        uniswapRouter = uniswapRouterAddress;
    }

    function setCounterparty(
        address zrc20,
        bytes memory contractAddress
    ) external onlyOwner {
        counterparty[zrc20] = contractAddress;
        emit CounterpartySet(zrc20, contractAddress);
    }

    function onCall(
        MessageContext calldata context,
        address zrc20,
        uint256 amount,
        bytes calldata message
    ) external override onlyGateway {
        (
            bytes memory receiver,
            address destination,
            bytes memory data,
            CallOptions memory callOptions,
            RevertOptions memory revertOptions
        ) = abi.decode(
                message,
                (bytes, address, bytes, CallOptions, RevertOptions)
            );

        (, uint256 gasFee) = IZRC20(destination).withdrawGasFeeWithGasLimit(
            callOptions.gasLimit
        );
        uint256 out = SwapHelperLib.swapExactTokensForTokens(
            uniswapRouter,
            zrc20,
            amount,
            destination,
            0
        );

        IZRC20(destination).approve(address(gateway), out);

        RevertOptions memory revertOptionsUniversal = RevertOptions(
            address(this),
            true,
            address(0),
            abi.encode(
                revertOptions,
                zrc20,
                revertOptions.onRevertGasLimit,
                receiver,
                data
            ),
            callOptions.gasLimit
        );

        bytes memory m = callOptions.isArbitraryCall
            ? abi.encodePacked(data, context.sender, true)
            : abi.encode(data, context.sender, true);

        gateway.withdrawAndCall(
            receiver,
            out - gasFee,
            destination,
            m,
            callOptions,
            revertOptionsUniversal
        );
    }

    // onRevert is called when a contract on the destination chain reverts.
    // onRevert sends a call back to the source chain
    function onRevert(RevertContext calldata context) external onlyGateway {
        (
            RevertOptions memory revertOptions,
            address destination,
            uint256 onRevertGasLimit,
            bytes memory receiver,
            bytes memory data
        ) = abi.decode(
                context.revertMessage,
                (RevertOptions, address, uint256, bytes, bytes)
            );
        uint256 out = SwapHelperLib.swapExactTokensForTokens(
            uniswapRouter,
            context.asset,
            context.amount,
            destination,
            0
        );
        (, uint256 gasFee) = IZRC20(destination).withdrawGasFeeWithGasLimit(
            onRevertGasLimit
        );
        if (out < gasFee) revert("Insufficient out amount for gas fee");

        IZRC20(destination).approve(address(gateway), out);
        gateway.withdrawAndCall(
            abi.encodePacked(revertOptions.revertAddress),
            out - gasFee,
            destination,
            abi.encode(data, receiver, false),
            CallOptions(onRevertGasLimit, false),
            RevertOptions(address(0), false, address(0), "", 0)
        );
    }
}
