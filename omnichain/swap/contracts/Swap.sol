// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@zetachain/protocol-contracts/contracts/zevm/SystemContract.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/zContract.sol";
import "@zetachain/toolkit/contracts/SwapHelperLib.sol";
import "@zetachain/toolkit/contracts/BytesHelperLib.sol";
import "@zetachain/toolkit/contracts/OnlySystem.sol";

contract Swap is zContract, OnlySystem {
    SystemContract public systemContract;
    uint256 constant BITCOIN = 18332;

    constructor(address systemContractAddress) {
        systemContract = SystemContract(systemContractAddress);
    }

    struct Params {
        address target;
        bytes to;
    }

    function onCrossChainCall(
        zContext calldata context,
        address zrc20,
        uint256 amount,
        bytes calldata message
    ) external virtual override onlySystem(systemContract) {
        Params memory params = Params({target: address(0), to: bytes("")});

        if (context.chainID == BITCOIN) {
            params.target = BytesHelperLib.bytesToAddress(message, 0);
            params.to = abi.encodePacked(
                BytesHelperLib.bytesToAddress(message, 20)
            );
        } else {
            (address targetToken, bytes memory recipient) = abi.decode(
                message,
                (address, bytes)
            );
            params.target = targetToken;
            params.to = recipient;
        }

        swapAndWithdraw(zrc20, amount, params.target, params.to);
    }

    function swapAndWithdraw(
        address inputToken,
        uint256 amount,
        address targetToken,
        bytes memory recipient
    ) internal {
        uint256 inputForGas;
        address gasZRC20;
        uint256 gasFee;

        (gasZRC20, gasFee) = IZRC20(targetToken).withdrawGasFee();

        inputForGas = SwapHelperLib.swapTokensForExactTokens(
            systemContract,
            inputToken,
            gasFee,
            gasZRC20,
            amount
        );

        uint256 outputAmount = SwapHelperLib.swapExactTokensForTokens(
            systemContract,
            inputToken,
            amount - inputForGas,
            targetToken,
            0
        );

        IZRC20(gasZRC20).approve(targetToken, gasFee);
        IZRC20(targetToken).withdraw(recipient, outputAmount);
    }
}
