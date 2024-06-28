// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@zetachain/protocol-contracts/contracts/zevm/SystemContract.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/zContract.sol";
import "@zetachain/toolkit/contracts/SwapHelperLib.sol";
import "@zetachain/toolkit/contracts/BytesHelperLib.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/IWZETA.sol";
import "@zetachain/toolkit/contracts/OnlySystem.sol";

contract SwapToAnyToken is zContract, OnlySystem {
    SystemContract public systemContract;

    uint256 constant BITCOIN = 18332;

    constructor(address systemContractAddress) {
        systemContract = SystemContract(systemContractAddress);
    }

    struct Params {
        address target;
        bytes to;
        bool withdraw;
    }

    receive() external payable {}

    function onCrossChainCall(
        zContext calldata context,
        address zrc20,
        uint256 amount,
        bytes calldata message
    ) external virtual override onlySystem(systemContract) {
        Params memory params = Params({
            target: address(0),
            to: bytes(""),
            withdraw: true
        });

        if (context.chainID == BITCOIN) {
            params.target = BytesHelperLib.bytesToAddress(message, 0);
            params.to = abi.encodePacked(
                BytesHelperLib.bytesToAddress(message, 20)
            );
            if (message.length >= 41) {
                params.withdraw = BytesHelperLib.bytesToBool(message, 40);
            }
        } else {
            (
                address targetToken,
                bytes memory recipient,
                bool withdrawFlag
            ) = abi.decode(message, (address, bytes, bool));
            params.target = targetToken;
            params.to = recipient;
            params.withdraw = withdrawFlag;
        }

        swapAndWithdraw(
            zrc20,
            amount,
            params.target,
            params.to,
            params.withdraw
        );
    }

    function swapAndWithdraw(
        address inputToken,
        uint256 amount,
        address targetToken,
        bytes memory recipient,
        bool withdraw
    ) internal {
        uint256 outputAmount;
        uint256 inputForGas;
        address gasZRC20;
        uint256 gasFee;

        if (withdraw) {
            (gasZRC20, gasFee) = IZRC20(targetToken).withdrawGasFee();

            inputForGas = SwapHelperLib.swapTokensForExactTokens(
                systemContract,
                inputToken,
                gasFee,
                gasZRC20,
                amount
            );
        }

        outputAmount = SwapHelperLib.swapExactTokensForTokens(
            systemContract,
            inputToken,
            withdraw ? amount - inputForGas : amount,
            targetToken,
            0
        );

        if (withdraw) {
            IZRC20(gasZRC20).approve(targetToken, gasFee);
            IZRC20(targetToken).withdraw(recipient, outputAmount);
        } else {
            address wzeta = systemContract.wZetaContractAddress();
            if (targetToken == wzeta) {
                IWETH9(wzeta).withdraw(outputAmount);
                address payable recipientAddress = payable(
                    address(uint160(bytes20(recipient)))
                );
                recipientAddress.transfer(outputAmount);
            } else {
                address recipientAddress = address(uint160(bytes20(recipient)));
                IWETH9(targetToken).transfer(recipientAddress, outputAmount);
            }
        }
    }

    function swap(
        address inputToken,
        uint256 amount,
        address targetToken,
        bytes memory recipient,
        bool withdraw
    ) public {
        IZRC20(inputToken).transferFrom(msg.sender, address(this), amount);

        swapAndWithdraw(inputToken, amount, targetToken, recipient, withdraw);
    }
}
