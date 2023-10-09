// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@zetachain/protocol-contracts/contracts/evm/tools/ZetaInteractor.sol";
import "@zetachain/protocol-contracts/contracts/evm/interfaces/ZetaInterfaces.sol";

contract Counter is ZetaInteractor, ZetaReceiver {
    error InvalidMessageType();
    error DecrementOverflow();

    event CounterEvent(address);
    event CounterRevertedEvent(address);
    mapping(address => uint256) public counter;

    bytes32 public constant COUNTER_MESSAGE_TYPE =
        keccak256("CROSS_CHAIN_COUNTER");
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

    function sendMessage(uint256 destinationChainId) external payable {
        if (!_isValidChainId(destinationChainId))
            revert InvalidDestinationChainId();

        uint256 crossChainGas = 2 * (10 ** 18);
        uint256 zetaValueAndGas = _zetaConsumer.getZetaFromEth{
            value: msg.value
        }(address(this), crossChainGas);
        _zetaToken.approve(address(connector), zetaValueAndGas);

        connector.send(
            ZetaInterfaces.SendInput({
                destinationChainId: destinationChainId,
                destinationAddress: interactorsByChainId[destinationChainId],
                destinationGasLimit: 300000,
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

        if (counter[from] <= 0) revert DecrementOverflow();
        counter[from]--;
        emit CounterRevertedEvent(from);
    }
}
