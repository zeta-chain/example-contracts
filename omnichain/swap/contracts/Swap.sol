// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@zetachain/protocol-contracts/contracts/zevm/SystemContract.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/zContract.sol";

import "@zetachain/toolkit/contracts/SwapHelperLib.sol";
import "@zetachain/toolkit/contracts/BytesHelperLib.sol";

contract Swap is zContract {
    error SenderNotSystemContract();
    error WrongGasContract();
    error NotEnoughToPayGasFee();

    SystemContract public immutable systemContract;
    uint256 constant BITCOIN = 18332;

    constructor(address systemContractAddress) {
        systemContract = SystemContract(systemContractAddress);
    }

    function onCrossChainCall(
        zContext calldata context,
        address zrc20,
        uint256 amount,
        bytes calldata message
    ) external virtual override {
        if (msg.sender != address(systemContract)) {
            revert SenderNotSystemContract();
        }

        uint32 targetChainID;
        bytes memory recipient;
        uint256 minAmountOut;

        if (context.chainID == BITCOIN) {
            targetChainID = BytesHelperLib.bytesToUint32(message, 0);
            recipient = BytesHelperLib.bytesToBech32Bytes(message, 4);
        } else {
            (
                uint32 targetChainID_,
                bytes32 recipient_,
                uint256 minAmountOut_
            ) = abi.decode(message, (uint32, bytes32, uint256));
            targetChainID = targetChainID_;
            recipient = abi.encodePacked(recipient_);
            minAmountOut = minAmountOut_;
        }

        address targetZRC20 = systemContract.gasCoinZRC20ByChainId(
            targetChainID
        );

        uint256 outputAmount = SwapHelperLib._doSwap(
            systemContract.wZetaContractAddress(),
            systemContract.uniswapv2FactoryAddress(),
            systemContract.uniswapv2Router02Address(),
            zrc20,
            amount,
            targetZRC20,
            minAmountOut
        );

        (address gasZRC20, uint256 gasFee) = IZRC20(targetZRC20)
            .withdrawGasFee();

        if (gasZRC20 != targetZRC20) revert WrongGasContract();
        if (gasFee >= outputAmount) revert NotEnoughToPayGasFee();

        IZRC20(targetZRC20).approve(targetZRC20, gasFee);
        IZRC20(targetZRC20).withdraw(recipient, outputAmount - gasFee);
    }
}
