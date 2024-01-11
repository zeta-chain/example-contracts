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
    error InvalidRecipient();

    event DestinationRegistered(address);
    event Withdrawal(address, uint256, bytes);

    address[] public destinationTokens;
    SystemContract public immutable systemContract;

    uint256 constant BITCOIN = 18332;
    address constant BITCOIN_ZRC20_ADDRESS = 0x65a45c57636f9BcCeD4fe193A602008578BcA90b;

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

    function registerDestinationToken(
        address[] calldata destinationToken
    ) external onlyOwner {
        for (uint256 i; i < destinationToken.length; i++) {
            destinationTokens.push(destinationToken[i]);
            emit DestinationRegistered(destinationToken[i]);
        }
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
    ) external virtual override onlySystem {
        (address evmRecipient, bytes memory btcRecipient) = parseMessage(context.chainID, message);

        uint256 totalTransfers = _getTotalTransfers(zrc20);
        if (totalTransfers == 0) revert NoAvailableTransfers();

        uint256 amountToTransfer = amount / totalTransfers;
        uint256 leftOver = amount -
            amountToTransfer *
            totalTransfers;

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

            bytes memory recipient = abi.encodePacked(
                BytesHelperLib.addressToBytes(evmRecipient)
            );
            
            if (targetZRC20 == BITCOIN_ZRC20_ADDRESS) {
                if (btcRecipient.length == 0) revert InvalidRecipient();
                recipient = abi.encodePacked(btcRecipient);
            }

            _doSwapAndWithdraw(zrc20, amountToTransfer, targetZRC20, recipient);
        }
    }

    function _doSwapAndWithdraw(
        address zrc20,
        uint256 amountToTransfer,
        address targetZRC20,
        bytes memory recipient
    ) internal {
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
            bytes32(recipient)
        );
        emit Withdrawal(targetZRC20, outputAmount, recipient);
    }

    function parseMessage(
        uint256 chainID,
        bytes calldata message)
        public
        pure
        returns (address, bytes memory)
    {
        address evmRecipient;
        bytes memory btcRecipient;
        if (chainID == BITCOIN) {
            evmRecipient = BytesHelperLib.bytesToAddress(message, 0);
        } else {
            if (message.length > 32) {
                (address evmAddress, bytes memory btcAddress) = abi.decode(
                    message,
                    (address, bytes)
                );
                evmRecipient = evmAddress;
                btcRecipient = btcAddress;
            } else {
                evmRecipient = abi.decode(message, (address));
            }
        }

        return (evmRecipient, btcRecipient);
    }
        
}
