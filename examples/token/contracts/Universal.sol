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

contract Universal is ERC20, Ownable, UniversalContract {
    GatewayZEVM public immutable gateway;
    SystemContract public immutable systemContract =
        SystemContract(0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9);
    uint256 private _nextTokenId;
    bool public isUniversal = true;
    uint256 public gasLimit = 700000;

    error TransferFailed();

    mapping(address => bytes) public counterparty;

    event CounterpartySet(address indexed zrc20, bytes indexed contractAddress);

    constructor(
        address payable gatewayAddress,
        address initialOwner
    ) ERC20("MyToken", "MTK") Ownable(initialOwner) {
        gateway = GatewayZEVM(gatewayAddress);
    }

    function setCounterparty(
        address zrc20,
        bytes memory contractAddress
    ) external onlyOwner {
        counterparty[zrc20] = contractAddress;
        emit CounterpartySet(zrc20, contractAddress);
    }

    function transferCrossChain(
        address receiver,
        address zrc20,
        uint256 amount
    ) public {
        _burn(msg.sender, amount);

        (, uint256 gasFee) = IZRC20(zrc20).withdrawGasFeeWithGasLimit(gasLimit);
        if (!IZRC20(zrc20).transferFrom(msg.sender, address(this), gasFee))
            revert TransferFailed();
        IZRC20(zrc20).approve(address(gateway), gasFee);

        bytes memory encodedData = abi.encode(receiver, amount);

        CallOptions memory callOptions = CallOptions(gasLimit, false);

        RevertOptions memory revertOptions = RevertOptions(
            address(this),
            true,
            address(0),
            encodedData,
            gasLimit
        );

        gateway.call(
            counterparty[zrc20],
            zrc20,
            encodedData,
            callOptions,
            revertOptions
        );
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function onCall(
        MessageContext calldata messageContext,
        address zrc20,
        uint256 amount,
        bytes calldata message
    ) external override {
        if (keccak256(messageContext.origin) != keccak256(counterparty[zrc20]))
            revert("Unauthorized");
        (address receiver, uint256 tokenAmount, address destination) = abi
            .decode(message, (address, uint256, address));
        if (destination == address(0)) {
            _mint(receiver, tokenAmount);
        } else {
            (, uint256 gasFee) = IZRC20(destination).withdrawGasFeeWithGasLimit(
                700000
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
                CallOptions(700000, false),
                RevertOptions(address(0), false, address(0), "", 0)
            );
        }
    }

    function onRevert(RevertContext calldata context) external {}
}
