// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@zetachain/protocol-contracts/contracts/evm/tools/ZetaInteractor.sol";
import "@zetachain/protocol-contracts/contracts/evm/interfaces/ZetaInterfaces.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract CrossChainNFT is
    ERC721("CrossChainNFT", "CCNFT"),
    ZetaInteractor,
    ZetaReceiver
{
    event CrossChainNFTEvent(address, uint256);
    event CrossChainNFTRevertedEvent(address, uint256);

    ZetaTokenConsumer private immutable _zetaConsumer;
    IERC20 internal immutable _zetaToken;
    uint256 private _tokenIds;

    constructor(
        address connectorAddress,
        address zetaTokenAddress,
        address zetaConsumerAddress,
        bool useEven
    ) ZetaInteractor(connectorAddress) {
        _zetaToken = IERC20(zetaTokenAddress);
        _zetaConsumer = ZetaTokenConsumer(zetaConsumerAddress);

        _tokenIds++;
        if (useEven) _tokenIds++;
    }

    function sendMessage(
        uint256 destinationChainId,
        address to,
        uint256 token
    ) external payable {
        if (!_isValidChainId(destinationChainId))
            revert InvalidDestinationChainId();

        uint256 crossChainGas = 2 * (10 ** 18);
        uint256 zetaValueAndGas = _zetaConsumer.getZetaFromEth{
            value: msg.value
        }(address(this), crossChainGas);
        _zetaToken.approve(address(connector), zetaValueAndGas);

        _burn(token);

        connector.send(
            ZetaInterfaces.SendInput({
                destinationChainId: destinationChainId,
                destinationAddress: interactorsByChainId[destinationChainId],
                destinationGasLimit: 300000,
                message: abi.encode(to, token, msg.sender),
                zetaValueAndGas: zetaValueAndGas,
                zetaParams: abi.encode("")
            })
        );
    }

    function onZetaMessage(
        ZetaInterfaces.ZetaMessage calldata zetaMessage
    ) external override isValidMessageCall(zetaMessage) {
        (address to, uint256 token) = abi.decode(
            zetaMessage.message,
            (address, uint256)
        );

        _safeMint(to, token);

        emit CrossChainNFTEvent(to, token);
    }

    function onZetaRevert(
        ZetaInterfaces.ZetaRevert calldata zetaRevert
    ) external override isValidRevertCall(zetaRevert) {
        (address to, uint256 token, address from) = abi.decode(
            zetaRevert.message,
            (address, uint256, address)
        );

        _safeMint(from, token);

        emit CrossChainNFTRevertedEvent(to, token);
    }

    function mint(address to) public returns (uint256) {
        _tokenIds++;
        _tokenIds++;

        _safeMint(to, _tokenIds);
        return _tokenIds;
    }
}
