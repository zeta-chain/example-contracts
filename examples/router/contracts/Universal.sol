// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {RevertContext, RevertOptions} from "@zetachain/protocol-contracts/contracts/Revert.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/UniversalContract.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/IGatewayZEVM.sol";
import "@zetachain/protocol-contracts/contracts/zevm/GatewayZEVM.sol";
import {SwapHelperLib} from "@zetachain/toolkit/contracts/SwapHelperLib.sol";
import {SystemContract} from "@zetachain/toolkit/contracts/SystemContract.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Universal is UniversalContract, Ownable {
    GatewayZEVM public immutable gateway;
    SystemContract public immutable systemContract =
        SystemContract(0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9);
    bool public isUniversal = true;
    uint256 public gasLimit = 700000;

    error TransferFailed();
    error InsufficientOutAmount(uint256 out, uint256 gasFee);

    mapping(address => bytes) public counterparty;

    event CounterpartySet(address indexed zrc20, bytes indexed contractAddress);
    event GasFeeAndOut(uint256 gasFee, uint256 out);
    event RevertEvent(string);

    modifier onlyGateway() {
        require(msg.sender == address(gateway), "Caller is not the gateway");
        _;
    }

    constructor(
        address payable gatewayAddress,
        address initialOwner
    ) Ownable(initialOwner) {
        gateway = GatewayZEVM(gatewayAddress);
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
            systemContract,
            zrc20,
            amount,
            destination,
            0
        );
        require(out >= gasFee, "Insufficient out amount for gas fee");
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
            gasLimit
        );

        gateway.withdrawAndCall(
            receiver,
            out - gasFee,
            destination,
            abi.encode(data, context.origin, true),
            callOptions,
            revertOptionsUniversal
        );
    }

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
            systemContract,
            context.asset,
            context.amount,
            destination,
            0
        );
        (, uint256 gasFee) = IZRC20(destination).withdrawGasFeeWithGasLimit(
            700000
        );
        if (out < gasFee) revert("Insufficient out amount for gas fee");

        IZRC20(destination).approve(address(gateway), out);
        gateway.withdrawAndCall(
            abi.encodePacked(revertOptions.revertAddress),
            out - gasFee,
            destination,
            abi.encode(data, receiver, false),
            CallOptions(700000, false),
            RevertOptions(address(0), false, address(0), "", 0)
        );
    }
}
