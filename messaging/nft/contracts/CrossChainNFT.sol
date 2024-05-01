// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@zetachain/protocol-contracts/contracts/evm/tools/ZetaInteractor.sol";
import "@zetachain/protocol-contracts/contracts/evm/interfaces/ZetaInterfaces.sol";

contract CrossChainNFT is ZetaInteractor, ZetaReceiver {

    event CrossChainNFTEvent(uint256, address, address);
    event CrossChainNFTRevertedEvent(uint256, address, address);

    ZetaTokenConsumer private immutable _zetaConsumer;
    IERC20 internal immutable _zetaToken;

    constructor(address connectorAddress, address zetaTokenAddress, address zetaConsumerAddress) ZetaInteractor(connectorAddress) {
        _zetaToken = IERC20(zetaTokenAddress);
        _zetaConsumer = ZetaTokenConsumer(zetaConsumerAddress);
    }

    function sendMessage(uint256 destinationChainId, uint256 token, address sender, address to) external payable {
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
                message: abi.encode(token, sender, to),
                zetaValueAndGas: zetaValueAndGas,
                zetaParams: abi.encode("")
            })
        );
    }


    function onZetaMessage(
        ZetaInterfaces.ZetaMessage calldata zetaMessage
    ) external override isValidMessageCall(zetaMessage) {
        (uint256 token , address sender , address to ) = abi.decode(
            zetaMessage.message, (uint256, address, address)
        );

        emit CrossChainNFTEvent(token, sender, to);
    }

    function onZetaRevert(
        ZetaInterfaces.ZetaRevert calldata zetaRevert
    ) external override isValidRevertCall(zetaRevert) {
        (uint256 token, address sender, address to) = abi.decode(
            zetaRevert.message,
            (uint256, address, address)
        );

        emit CrossChainNFTRevertedEvent(token, sender, to);
    }

}
