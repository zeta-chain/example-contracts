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

    mapping(address => bytes) public counterparty;

    event CounterpartySet(address indexed zrc20, bytes indexed contractAddress);

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
            bytes memory encodedData,
            CallOptions memory callOptions,
            RevertOptions memory revertOptions
        ) = abi.decode(
                message,
                (bytes, address, bytes, CallOptions, RevertOptions)
            );

        (, uint256 gasFee) = IZRC20(destination).withdrawGasFeeWithGasLimit(
            callOptions.gasLimit
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
            receiver,
            destination,
            encodedData,
            callOptions,
            revertOptions
        );
    }

    function onRevert(RevertContext calldata context) external onlyGateway {
        // (uint256 tokenId, address sender, string memory uri) = abi.decode(
        //     context.revertMessage,
        //     (uint256, address, string)
        // );
        // _safeMint(sender, tokenId);
        // _setTokenURI(tokenId, uri);
    }
}
