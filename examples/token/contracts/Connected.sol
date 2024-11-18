// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@zetachain/protocol-contracts/contracts/evm/GatewayEVM.sol";
import {RevertContext} from "@zetachain/protocol-contracts/contracts/Revert.sol";
import "./shared/Events.sol";

contract Connected is ERC20, Ownable2Step, Events {
    GatewayEVM public immutable gateway;
    address public counterparty;
    uint256 public immutable gasLimit;

    error InvalidAddress();
    error Unauthorized();
    error InvalidGasLimit();
    error GasTokenTransferFailed();

    modifier onlyGateway() {
        if (msg.sender != address(gateway)) revert Unauthorized();
        _;
    }

    function setCounterparty(address contractAddress) external onlyOwner {
        counterparty = contractAddress;
        emit SetCounterparty(contractAddress);
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
        gasLimit = gas;
        gateway = GatewayEVM(gatewayAddress);
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function transferCrossChain(
        address destination,
        address receiver,
        uint256 amount
    ) external payable {
        if (receiver == address(0)) revert InvalidAddress();
        _burn(msg.sender, amount);

        bytes memory message = abi.encode(
            destination,
            receiver,
            amount,
            msg.sender
        );
        if (destination == address(0)) {
            gateway.call(
                counterparty,
                message,
                RevertOptions(address(this), false, address(0), message, 0)
            );
        } else {
            gateway.depositAndCall{value: msg.value}(
                counterparty,
                message,
                RevertOptions(
                    address(this),
                    true,
                    address(0),
                    abi.encode(amount, msg.sender),
                    gasLimit
                )
            );
        }

        emit TokenTransfer(destination, receiver, amount);
    }

    function onCall(
        MessageContext calldata context,
        bytes calldata message
    ) external payable onlyGateway returns (bytes4) {
        if (context.sender != counterparty) revert Unauthorized();
        (
            address receiver,
            uint256 amount,
            uint256 gasAmount,
            address sender
        ) = abi.decode(message, (address, uint256, uint256, address));
        _mint(receiver, amount);
        if (gasAmount > 0) {
            (bool success, ) = sender.call{value: amount}("");
            if (!success) revert GasTokenTransferFailed();
        }
        emit TokenTransferReceived(receiver, amount);
        return "";
    }

    function onRevert(RevertContext calldata context) external onlyGateway {
        (uint256 amount, address receiver) = abi.decode(
            context.revertMessage,
            (uint256, address)
        );
        _mint(receiver, amount);
        emit TokenTransferReverted(receiver, amount);
    }

    receive() external payable {}

    fallback() external payable {}
}
