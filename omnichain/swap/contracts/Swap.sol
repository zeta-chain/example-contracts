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

    function onCrossChainCall(
        zContext calldata context,
        address zrc20,
        uint256 amount,
        bytes calldata message
    ) external virtual override onlySystem {
        uint32 targetChainID;
        address recipient;
        uint256 minAmountOut;

        if (context.chainID == BITCOIN) {
            targetChainID = BytesHelperLib.bytesToUint32(message, 0);
            recipient = BytesHelperLib.bytesToAddress(message, 4);
        } else {
            (
                uint32 targetChainID_,
                address recipient_,
                uint256 minAmountOut_
            ) = abi.decode(message, (uint32, address, uint256));
            targetChainID = targetChainID_;
            recipient = recipient_;
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
        IZRC20(targetZRC20).withdraw(
            abi.encodePacked(recipient),
            outputAmount - gasFee
        );
    }
}
