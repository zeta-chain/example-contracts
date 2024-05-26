// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@zetachain/protocol-contracts/contracts/evm/tools/ZetaInteractor.sol";
import "@zetachain/protocol-contracts/contracts/evm/interfaces/ZetaInterfaces.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract CrossChainERC20 is ERC20, ERC20Burnable, ZetaInteractor, ZetaReceiver {
    error InsufficientBalance();

    event CrossChainERC20Event(address, uint256);
    event CrossChainERC20RevertedEvent(address, uint256);

    ZetaTokenConsumer private immutable _zetaConsumer;
    IERC20 internal immutable _zetaToken;

    constructor(
        address connectorAddress,
        address zetaTokenAddress,
        address zetaConsumerAddress
    ) ERC20("CrossChain Token", "CCT") ZetaInteractor(connectorAddress) {
        _zetaToken = IERC20(zetaTokenAddress);
        _zetaConsumer = ZetaTokenConsumer(zetaConsumerAddress);

        _mint(msg.sender, 1000000 * 10 ** decimals());
    }

    function sendMessage(
        uint256 destinationChainId,
        address to,
        uint256 value
    ) external payable {
        if (!_isValidChainId(destinationChainId))
            revert InvalidDestinationChainId();

        uint256 crossChainGas = 2 * (10 ** 18);
        uint256 zetaValueAndGas = _zetaConsumer.getZetaFromEth{
            value: msg.value
        }(address(this), crossChainGas);
        _zetaToken.approve(address(connector), zetaValueAndGas);

        if (balanceOf(msg.sender) < value) revert InsufficientBalance();
        _burn(msg.sender, value);

        connector.send(
            ZetaInterfaces.SendInput({
                destinationChainId: destinationChainId,
                destinationAddress: interactorsByChainId[destinationChainId],
                destinationGasLimit: 300000,
                message: abi.encode(to, value, msg.sender),
                zetaValueAndGas: zetaValueAndGas,
                zetaParams: abi.encode("")
            })
        );
    }

    function onZetaMessage(
        ZetaInterfaces.ZetaMessage calldata zetaMessage
    ) external override isValidMessageCall(zetaMessage) {
        (address to, uint256 value) = abi.decode(
            zetaMessage.message,
            (address, uint256)
        );

        _mint(to, value);

        emit CrossChainERC20Event(to, value);
    }

    function onZetaRevert(
        ZetaInterfaces.ZetaRevert calldata zetaRevert
    ) external override isValidRevertCall(zetaRevert) {
        (address to, uint256 value, address from) = abi.decode(
            zetaRevert.message,
            (address, uint256, address)
        );

        _mint(from, value);

        emit CrossChainERC20RevertedEvent(to, value);
    }
}
