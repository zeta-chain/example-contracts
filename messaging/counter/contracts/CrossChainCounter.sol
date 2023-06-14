// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@zetachain/protocol-contracts/contracts/evm/tools/ZetaInteractor.sol";
import "@zetachain/protocol-contracts/contracts/evm/interfaces/ZetaInterfaces.sol";

interface CrossChainCounterErrors {
    error InvalidMessageType();

    error DecrementOverflow();
}

contract CrossChainCounter is
    ZetaInteractor,
    ZetaReceiver,
    CrossChainCounterErrors
{
    bytes32 public constant CROSS_CHAIN_INCREMENT_MESSAGE =
        keccak256("CROSS_CHAIN_INCREMENT");

    mapping(address => uint256) public counter;

    ZetaTokenConsumer private immutable _zetaConsumer;
    IERC20 internal immutable _zetaToken;

    constructor(
        address connectorAddress,
        address zetaTokenAddress,
        address zetaConsumerAddress
    ) ZetaInteractor(connectorAddress) {
        _zetaToken = IERC20(zetaTokenAddress);
        _zetaConsumer = ZetaTokenConsumer(zetaConsumerAddress);
    }

    function crossChainCount(uint256 destinationChainId) external payable {
        if (!_isValidChainId(destinationChainId))
            revert InvalidDestinationChainId();

        uint256 crossChainGas = 18 * (10 ** 18);
        uint256 zetaValueAndGas = _zetaConsumer.getZetaFromEth{
            value: msg.value
        }(address(this), crossChainGas);
        _zetaToken.approve(address(connector), zetaValueAndGas);

        counter[msg.sender]++;
        connector.send(
            ZetaInterfaces.SendInput({
                destinationChainId: destinationChainId,
                destinationAddress: interactorsByChainId[destinationChainId],
                destinationGasLimit: 300000,
                message: abi.encode(CROSS_CHAIN_INCREMENT_MESSAGE, msg.sender),
                zetaValueAndGas: zetaValueAndGas,
                zetaParams: abi.encode("")
            })
        );
    }

    function onZetaMessage(
        ZetaInterfaces.ZetaMessage calldata zetaMessage
    ) external override isValidMessageCall(zetaMessage) {
        (bytes32 messageType, address messageFrom) = abi.decode(
            zetaMessage.message,
            (bytes32, address)
        );

        if (messageType != CROSS_CHAIN_INCREMENT_MESSAGE)
            revert InvalidMessageType();

        counter[messageFrom]++;
    }

    function onZetaRevert(
        ZetaInterfaces.ZetaRevert calldata zetaRevert
    ) external override isValidRevertCall(zetaRevert) {
        (bytes32 messageType, address messageFrom) = abi.decode(
            zetaRevert.message,
            (bytes32, address)
        );

        if (messageType != CROSS_CHAIN_INCREMENT_MESSAGE)
            revert InvalidMessageType();
        if (counter[messageFrom] <= 0) revert DecrementOverflow();

        counter[messageFrom]--;
    }
}
