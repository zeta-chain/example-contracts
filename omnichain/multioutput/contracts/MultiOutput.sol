// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@zetachain/protocol-contracts/contracts/zevm/SystemContract.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/zContract.sol";
import "@zetachain/toolkit/contracts/BytesHelperLib.sol";
import "@zetachain/toolkit/contracts/SwapHelperLib.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MultiOutput is zContract, Ownable {
    error SenderNotSystemContract();
    error NoAvailableTransfers();

    event DestinationRegistered(address);
    event Withdrawal(address, uint256, address);

    address[] public destinationTokens;
    SystemContract public immutable systemContract;

    constructor(address systemContractAddress) {
        systemContract = SystemContract(systemContractAddress);
    }

    function registerDestinationToken(
        address destinationToken
    ) external onlyOwner {
        destinationTokens.push(destinationToken);
        emit DestinationRegistered(destinationToken);
    }

    function _getTotalTransfers(address zrc20) internal view returns (uint256) {
        uint256 total = 0;
        for (uint256 i; i < destinationTokens.length; i++) {
            if (destinationTokens[i] == zrc20) continue;
            total++;
        }

        return total;
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
        address recipient = abi.decode(message, (address));
        if (_getTotalTransfers(zrc20) == 0) revert NoAvailableTransfers();

        uint256 amountToTransfer = amount / _getTotalTransfers(zrc20);
        uint256 leftOver = amount -
            amountToTransfer *
            _getTotalTransfers(zrc20);

        uint256 lastTransferIndex = destinationTokens[
            destinationTokens.length - 1
        ] == zrc20
            ? destinationTokens.length - 2
            : destinationTokens.length - 1;

        for (uint256 i; i < destinationTokens.length; i++) {
            address targetZRC20 = destinationTokens[i];
            if (targetZRC20 == zrc20) continue;

            if (lastTransferIndex == i) {
                amountToTransfer += leftOver;
            }

            uint256 outputAmount = SwapHelperLib._doSwap(
                systemContract.wZetaContractAddress(),
                systemContract.uniswapv2FactoryAddress(),
                systemContract.uniswapv2Router02Address(),
                zrc20,
                amountToTransfer,
                targetZRC20,
                0
            );
            SwapHelperLib._doWithdrawal(
                targetZRC20,
                outputAmount,
                BytesHelperLib.addressToBytes(recipient)
            );
            emit Withdrawal(targetZRC20, outputAmount, recipient);
        }
    }
}
