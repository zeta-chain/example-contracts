// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@zetachain/protocol-contracts/contracts/zevm/SystemContract.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/zContract.sol";
import "@zetachain/toolkit/contracts/SwapHelperLib.sol";
import "@zetachain/toolkit/contracts/BytesHelperLib.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/IWZETA.sol";

contract SwapToZeta is zContract {
    SystemContract public systemContract;

    uint256 constant BITCOIN = 18332;

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
        address target;
        bytes memory to;

        if (context.chainID == BITCOIN) {
            target = BytesHelperLib.bytesToAddress(message, 0);
            to = abi.encodePacked(BytesHelperLib.bytesToAddress(message, 20));
        } else {
            (address targetToken, bytes memory recipient) = abi.decode(
                message,
                (address, bytes)
            );
            target = targetToken;
            to = recipient;
        }

        address wzeta = systemContract.wZetaContractAddress();
        bool isTargetZeta = target == wzeta;
        uint256 inputForGas;
        address gasZRC20;
        uint256 gasFee;

        if (!isTargetZeta) {
            (gasZRC20, gasFee) = IZRC20(target).withdrawGasFee();

            inputForGas = SwapHelperLib.swapTokensForExactTokens(
                systemContract,
                zrc20,
                gasFee,
                gasZRC20,
                amount
            );
        }

        uint256 outputAmount = SwapHelperLib.swapExactTokensForTokens(
            systemContract,
            zrc20,
            isTargetZeta ? amount : amount - inputForGas,
            target,
            0
        );

        if (isTargetZeta) {
            IWETH9(wzeta).transfer(address(uint160(bytes20(to))), outputAmount);
        } else {
            IZRC20(gasZRC20).approve(target, gasFee);
            IZRC20(target).withdraw(to, outputAmount);
        }
    }
}
