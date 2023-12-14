// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@zetachain/protocol-contracts/contracts/zevm/SystemContract.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/zContract.sol";
import "@zetachain/toolkit/contracts/SwapHelperLib.sol";
import "@zetachain/toolkit/contracts/BytesHelperLib.sol";

contract Swap is zContract {
    SystemContract public immutable systemContract;
    uint256 constant BITCOIN = 18332;
    error WrongGasContract();
    error NotEnoughToPayGasFee();
    event TransferRequested(bytes recipient);

    constructor(address systemContractAddress) {
        systemContract = SystemContract(systemContractAddress);
    }

    modifier onlySystem() {
        require(
            msg.sender == address(systemContract),
            "Only system contract can call this function"
        );
        _;
    }

    function bytesToAddress(
        bytes memory data,
        uint256 offset
    ) internal pure returns (address output) {
        bytes memory b = new bytes(20);
        for (uint256 i = 0; i < 20; i++) {
            b[i] = data[i + offset];
        }
        assembly {
            output := mload(add(b, 20))
        }
    }

    function onCrossChainCall(
        zContext calldata context,
        address zrc20,
        uint256 amount,
        bytes calldata message
    ) external virtual override onlySystem {
        address targetTokenAddress;
        bytes memory recipientAddress;
        uint8 action;

        if (context.chainID == BITCOIN) {
            action = uint8(message[0]);
            targetTokenAddress = BytesHelperLib.bytesToAddress(message, 1);
            recipientAddress = abi.encodePacked(
                BytesHelperLib.bytesToAddress(message, 21)
            );
        } else {
            (uint8 code, address targetToken, bytes memory recipient) = abi
                .decode(message, (uint8, address, bytes));
            action = code;
            targetTokenAddress = targetToken;
            recipientAddress = recipient;
        }

        uint256 outputAmount = SwapHelperLib._doSwap(
            systemContract.wZetaContractAddress(),
            systemContract.uniswapv2FactoryAddress(),
            systemContract.uniswapv2Router02Address(),
            zrc20,
            amount,
            targetTokenAddress,
            0
        );

        (address gasZRC20, uint256 gasFee) = IZRC20(targetTokenAddress)
            .withdrawGasFee();

        if (gasZRC20 != targetTokenAddress) revert WrongGasContract();
        if (gasFee >= outputAmount) revert NotEnoughToPayGasFee();

        if (action == 1) {
            IZRC20(targetTokenAddress).approve(targetTokenAddress, gasFee);
            IZRC20(targetTokenAddress).withdraw(
                recipientAddress,
                outputAmount - gasFee
            );
        } else if (action == 2) {
            IZRC20(targetTokenAddress).approve(
                targetTokenAddress,
                outputAmount
            );

            IZRC20(targetTokenAddress).transfer(
                bytesToAddress(recipientAddress, 0),
                outputAmount
            );
        }
    }
}
