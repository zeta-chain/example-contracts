// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import {RevertContext, RevertOptions} from "@zetachain/protocol-contracts/contracts/Revert.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/UniversalContract.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/IGatewayZEVM.sol";
import "@zetachain/protocol-contracts/contracts/zevm/GatewayZEVM.sol";
import {SwapHelperLib} from "@zetachain/toolkit/contracts/SwapHelperLib.sol";
import {SystemContract} from "@zetachain/toolkit/contracts/SystemContract.sol";
import "./shared/Events.sol";

contract Universal is ERC20, Ownable, UniversalContract, Events {
    GatewayZEVM public immutable gateway;
    SystemContract public immutable systemContract =
        SystemContract(0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9);
    uint256 private _nextTokenId;
    bool public isUniversal = true;
    uint256 public gasLimit;

    error TransferFailed();
    error Unauthorized();
    error InvalidAddress();
    error InvalidGasLimit();

    mapping(address => bytes) public counterparty;

    modifier onlyGateway() {
        require(msg.sender == address(gateway), "Caller is not the gateway");
        _;
    }

    constructor(
        address payable gatewayAddress,
        address owner,
        string memory name,
        string memory symbol,
        uint256 gas
    ) ERC20(name, symbol) Ownable(owner) {
        if (gatewayAddress == address(0) || owner == address(0))
            revert InvalidAddress();
        if (gas == 0) revert InvalidGasLimit();
        gateway = GatewayZEVM(gatewayAddress);
        gasLimit = gas;
    }

    function setCounterparty(
        address zrc20,
        bytes memory contractAddress
    ) external onlyOwner {
        counterparty[zrc20] = contractAddress;
        emit CounterpartyMappingSet(zrc20, contractAddress);
    }

    function transferCrossChain(
        address destination,
        address receiver,
        uint256 amount
    ) public {
        if (receiver == address(0)) revert InvalidAddress();
        _burn(msg.sender, amount);

        (, uint256 gasFee) = IZRC20(destination).withdrawGasFeeWithGasLimit(
            gasLimit
        );
        if (
            !IZRC20(destination).transferFrom(msg.sender, address(this), gasFee)
        ) revert TransferFailed();
        IZRC20(destination).approve(address(gateway), gasFee);
        bytes memory message = abi.encode(receiver, amount);

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
        emit TokenTransfer(destination, receiver, amount);
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function onCall(
        MessageContext calldata context,
        address zrc20,
        uint256 amount,
        bytes calldata message
    ) external override onlyGateway {
        if (keccak256(context.origin) != keccak256(counterparty[zrc20]))
            revert Unauthorized();
        (address destination, address receiver, uint256 tokenAmount) = abi
            .decode(message, (address, address, uint256));
        if (destination == address(0)) {
            _mint(receiver, tokenAmount);
        } else {
            (, uint256 gasFee) = IZRC20(destination).withdrawGasFeeWithGasLimit(
                gasLimit
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
                abi.encode(receiver, tokenAmount),
                CallOptions(gasLimit, false),
                RevertOptions(address(0), false, address(0), "", 0)
            );
        }
        emit TokenTransferToDestination(destination, receiver, amount);
    }

    function onRevert(RevertContext calldata context) external onlyGateway {
        (address sender, uint256 amount) = abi.decode(
            context.revertMessage,
            (address, uint256)
        );
        _mint(sender, amount);
        emit TokenTransferReverted(sender, amount);
    }
}
