// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@zetachain/protocol-contracts/contracts/evm/GatewayEVM.sol";
import {RevertContext} from "@zetachain/protocol-contracts/contracts/Revert.sol";

contract Connected is ERC20, Ownable {
    GatewayEVM public immutable gateway;
    address public counterparty;

    function setCounterparty(address contractAddress) external onlyOwner {
        counterparty = contractAddress;
    }

    constructor(
        address payable gatewayAddress,
        address initialOwner
    ) ERC20("MyToken", "MTK") Ownable(initialOwner) {
        gateway = GatewayEVM(gatewayAddress);
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function transferCrossChain(
        address receiver,
        address destination,
        uint256 amount
    ) external payable {
        _burn(msg.sender, amount);
        bytes memory encodedData = abi.encode(receiver, amount, destination);

        RevertOptions memory revertOptions = RevertOptions(
            address(this),
            true,
            address(0),
            encodedData,
            0
        );

        if (destination == address(0)) {
            gateway.call(counterparty, encodedData, revertOptions);
        } else {
            gateway.depositAndCall{value: msg.value}(
                counterparty,
                encodedData,
                revertOptions
            );
        }
    }

    function onCall(
        MessageContext calldata messageContext,
        bytes calldata message
    ) external payable returns (bytes4) {
        if (messageContext.sender != counterparty) revert("Unauthorized");
        (address receiver, uint256 amount) = abi.decode(
            message,
            (address, uint256)
        );
        _mint(receiver, amount);
    }

    function onRevert(RevertContext calldata context) external {}

    receive() external payable {}

    fallback() external payable {}
}
