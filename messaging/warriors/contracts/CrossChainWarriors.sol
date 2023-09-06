// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@zetachain/protocol-contracts/contracts/evm/tools/ZetaInteractor.sol";
import "@zetachain/protocol-contracts/contracts/evm/interfaces/ZetaInterfaces.sol";

interface CrossChainWarriorsErrors {
    error InvalidMessageType();
}

contract CrossChainWarriors is
    ZetaInteractor,
    ZetaReceiver,
    CrossChainWarriorsErrors,
    ERC721("CrossChainWarriors", "CCWAR")
{
    using Counters for Counters.Counter;
    bytes32 public constant CROSS_CHAIN_WARRIORS_MESSAGE_TYPE =
        keccak256("CROSS_CHAIN_CROSS_CHAIN_WARRIORS");

    event CrossChainWarriorsEvent(uint256, address, address);
    event CrossChainWarriorsRevertedEvent(uint256, address, address);

    ZetaTokenConsumer private immutable _zetaConsumer;
    IERC20 internal immutable _zetaToken;
    Counters.Counter public tokenIds;

    constructor(
        address connectorAddress,
        address zetaTokenAddress,
        address zetaConsumerAddress,
        bool useEven
    ) ZetaInteractor(connectorAddress) {
        _zetaToken = IERC20(zetaTokenAddress);
        _zetaConsumer = ZetaTokenConsumer(zetaConsumerAddress);

        tokenIds.increment();
        if (useEven) tokenIds.increment();
    }

    function mint(address to) public returns (uint256) {
        uint256 newWarriorId = tokenIds.current();

        tokenIds.increment();
        tokenIds.increment();

        _safeMint(to, newWarriorId);
        return newWarriorId;
    }

    function _mintId(address to, uint256 tokenId) internal {
        _safeMint(to, tokenId);
    }

    function _burnWarrior(uint256 burnedWarriorId) internal {
        _burn(burnedWarriorId);
    }

    function sendMessage(
        uint256 destinationChainId,
        uint256 token,
        address to
    ) external payable {
        if (!_isValidChainId(destinationChainId))
            revert InvalidDestinationChainId();

        uint256 crossChainGas = 2 * (10 ** 18);
        uint256 zetaValueAndGas = _zetaConsumer.getZetaFromEth{
            value: msg.value
        }(address(this), crossChainGas);
        _zetaToken.approve(address(connector), zetaValueAndGas);

        _burnWarrior(token);

        connector.send(
            ZetaInterfaces.SendInput({
                destinationChainId: destinationChainId,
                destinationAddress: interactorsByChainId[destinationChainId],
                destinationGasLimit: 300000,
                message: abi.encode(
                    CROSS_CHAIN_WARRIORS_MESSAGE_TYPE,
                    token,
                    msg.sender,
                    to
                ),
                zetaValueAndGas: zetaValueAndGas,
                zetaParams: abi.encode("")
            })
        );
    }

    function onZetaMessage(
        ZetaInterfaces.ZetaMessage calldata zetaMessage
    ) external override isValidMessageCall(zetaMessage) {
        (bytes32 messageType, uint256 token, address sender, address to) = abi
            .decode(zetaMessage.message, (bytes32, uint256, address, address));

        if (messageType != CROSS_CHAIN_WARRIORS_MESSAGE_TYPE)
            revert InvalidMessageType();

        _mintId(to, token);

        emit CrossChainWarriorsEvent(token, sender, to);
    }

    function onZetaRevert(
        ZetaInterfaces.ZetaRevert calldata zetaRevert
    ) external override isValidRevertCall(zetaRevert) {
        (bytes32 messageType, uint256 token, address sender, address to) = abi
            .decode(zetaRevert.message, (bytes32, uint256, address, address));

        if (messageType != CROSS_CHAIN_WARRIORS_MESSAGE_TYPE)
            revert InvalidMessageType();

        _mintId(to, token);

        emit CrossChainWarriorsRevertedEvent(token, sender, to);
    }
}
