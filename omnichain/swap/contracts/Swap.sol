// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@zetachain/protocol-contracts/contracts/zevm/SystemContract.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/zContract.sol";
import "@zetachain/toolkit/contracts/SwapHelperLib.sol";
import "@zetachain/toolkit/contracts/BytesHelperLib.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Swap is zContract {
    SystemContract public systemContract;
    address public wzeta;
    address public factory;
    address public router;

    uint256 constant BITCOIN = 18332;

    constructor(address systemContractAddress) {
        systemContract = SystemContract(systemContractAddress);
        wzeta = systemContract.wZetaContractAddress();
        factory = systemContract.uniswapv2FactoryAddress();
        router = systemContract.uniswapv2Router02Address();
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
        address targetTokenAddress;
        bytes memory recipientAddress;

        if (context.chainID == BITCOIN) {
            targetTokenAddress = BytesHelperLib.bytesToAddress(message, 0);
            recipientAddress = abi.encodePacked(
                BytesHelperLib.bytesToAddress(message, 20)
            );
        } else {
            (address targetToken, bytes memory recipient) = abi.decode(
                message,
                (address, bytes)
            );
            targetTokenAddress = targetToken;
            recipientAddress = recipient;
        }

        if (targetTokenAddress == wzeta) {
            uint256 outputAmount = SwapHelperLib._doSwap(
                wzeta,
                factory,
                router,
                zrc20,
                amount,
                wzeta,
                0
            );

            IERC20(wzeta).transfer(
                address(uint160(bytes20(recipientAddress))),
                outputAmount
            );
        } else {
            (address gasZRC20, uint256 gasFee) = IZRC20(targetTokenAddress)
                .withdrawGasFee();

            uint256 inputForGas = SwapHelperLib.swapTokensForExactTokens(
                wzeta,
                factory,
                router,
                zrc20,
                gasFee,
                gasZRC20,
                amount
            );

            uint256 outputAmount = SwapHelperLib._doSwap(
                wzeta,
                factory,
                router,
                zrc20,
                amount - inputForGas,
                targetTokenAddress,
                0
            );

            IZRC20(gasZRC20).approve(targetTokenAddress, gasFee);
            IZRC20(targetTokenAddress).withdraw(recipientAddress, outputAmount);
        }
    }
}
