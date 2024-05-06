// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@zetachain/protocol-contracts/contracts/evm/tools/ZetaInteractor.sol";
import "@zetachain/protocol-contracts/contracts/evm/interfaces/ZetaInterfaces.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";

contract UniCCM is ZetaInteractor, ZetaReceiver {
    event UniCCMEvent(address recipient, address target);
    event UniCCMRevertedEvent(address recipient, address target);

    ZetaTokenConsumer private immutable _zetaConsumer;
    IERC20 internal immutable _zetaToken;
    ISwapRouter private immutable _swapRouter;

    uint24 public constant poolFee = 3000;

    constructor(
        address connectorAddress,
        address zetaTokenAddress,
        address zetaConsumerAddress,
        address swapRouterAddress
    ) ZetaInteractor(connectorAddress) {
        _zetaToken = IERC20(zetaTokenAddress);
        _zetaConsumer = ZetaTokenConsumer(zetaConsumerAddress);
        _swapRouter = ISwapRouter(swapRouterAddress);
    }

    function sendMessage(
        uint256 destinationChainId,
        address recipient,
        address target
    ) external payable {
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
                message: abi.encode(recipient, target),
                zetaValueAndGas: zetaValueAndGas,
                zetaParams: abi.encode("")
            })
        );
    }

    function onZetaMessage(
        ZetaInterfaces.ZetaMessage calldata zetaMessage
    ) external override isValidMessageCall(zetaMessage) {
        (address recipient, address target) = abi.decode(
            zetaMessage.message,
            (address, address)
        );

        uint256 zetaAmount = zetaMessage.zetaValue;

        _zetaToken.approve(address(_swapRouter), zetaAmount);

        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter
            .ExactInputSingleParams({
                tokenIn: address(_zetaToken),
                tokenOut: target,
                fee: poolFee,
                recipient: recipient,
                deadline: block.timestamp + 60,
                amountIn: zetaAmount,
                amountOutMinimum: 0,
                sqrtPriceLimitX96: 0
            });

        _swapRouter.exactInputSingle(params);

        emit UniCCMEvent(recipient, target);
    }

    function onZetaRevert(
        ZetaInterfaces.ZetaRevert calldata zetaRevert
    ) external override isValidRevertCall(zetaRevert) {
        (address recipient, address target) = abi.decode(
            zetaRevert.message,
            (address, address)
        );

        emit UniCCMRevertedEvent(recipient, target);
    }
}
