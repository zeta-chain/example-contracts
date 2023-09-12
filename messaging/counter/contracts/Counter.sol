// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@zetachain/protocol-contracts/contracts/evm/tools/ZetaInteractor.sol";
import "@zetachain/protocol-contracts/contracts/evm/interfaces/ZetaInterfaces.sol";

interface CounterErrors {
    error InvalidMessageType();
    // highlight-next-line
    error DecrementOverflow();
}

contract Counter is ZetaInteractor, ZetaReceiver, CounterErrors {
    bytes32 public constant COUNTER_MESSAGE_TYPE =
        keccak256("CROSS_CHAIN_COUNTER");

    event CounterEvent(address);
    event CounterRevertedEvent(address);
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

    // highlight-next-line
    function sendMessage(uint256 destinationChainId) external payable {
        if (!_isValidChainId(destinationChainId))
            revert InvalidDestinationChainId();

        uint256 crossChainGas = 2 * (10 ** 18);
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
                // highlight-next-line
                message: abi.encode(COUNTER_MESSAGE_TYPE, msg.sender),
                zetaValueAndGas: zetaValueAndGas,
                zetaParams: abi.encode("")
            })
        );
    }

    function onZetaMessage(
        ZetaInterfaces.ZetaMessage calldata zetaMessage
    ) external override isValidMessageCall(zetaMessage) {
        (bytes32 messageType, address from) = abi.decode(
            zetaMessage.message,
            (bytes32, address)
        );

        if (messageType != COUNTER_MESSAGE_TYPE) revert InvalidMessageType();

        // highlight-next-line
        counter[from]++;
        emit CounterEvent(from);
    }

    function onZetaRevert(
        ZetaInterfaces.ZetaRevert calldata zetaRevert
    ) external override isValidRevertCall(zetaRevert) {
        (bytes32 messageType, address from) = abi.decode(
            zetaRevert.message,
            (bytes32, address)
        );

        if (messageType != COUNTER_MESSAGE_TYPE) revert InvalidMessageType();

        // highlight-start
        if (counter[from] <= 0) revert DecrementOverflow();
        counter[from]--;
        // highlight-end
        emit CounterRevertedEvent(from);
    }
}
