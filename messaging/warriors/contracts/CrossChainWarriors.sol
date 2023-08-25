// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
// highlight-start
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
// highlight-end
import "@zetachain/protocol-contracts/contracts/evm/tools/ZetaInteractor.sol";
import "@zetachain/protocol-contracts/contracts/evm/interfaces/ZetaInterfaces.sol";

interface CrossChainWarriorsErrors {
    error InvalidMessageType();
}

contract CrossChainWarriors is
    ZetaInteractor,
    ZetaReceiver,
    // highlight-start
    CrossChainWarriorsErrors,
    ERC721("CrossChainWarriors", "CCWAR")
    // highlight-end
{
    // highlight-next-line
    using Counters for Counters.Counter;
    bytes32 public constant CROSS_CHAIN_WARRIORS_MESSAGE_TYPE =
        keccak256("CROSS_CHAIN_CROSS_CHAIN_WARRIORS");

    event CrossChainWarriorsEvent(uint256, address, address);
    event CrossChainWarriorsRevertedEvent(uint256, address, address);

    ZetaTokenConsumer private immutable _zetaConsumer;
    IERC20 internal immutable _zetaToken;
    // highlight-next-line
    Counters.Counter public tokenIds;

    constructor(
        address connectorAddress,
        address zetaTokenAddress,
        address zetaConsumerAddress
    ) ZetaInteractor(connectorAddress) {
        _zetaToken = IERC20(zetaTokenAddress);
        _zetaConsumer = ZetaTokenConsumer(zetaConsumerAddress);

        // highlight-start
        tokenIds.increment();
        tokenIds.increment();
        // highlight-end
    }

    // highlight-start
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

    // highlight-end

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

        // highlight-next-line
        _burnWarrior(token);

        connector.send(
            ZetaInterfaces.SendInput({
                destinationChainId: destinationChainId,
                destinationAddress: interactorsByChainId[destinationChainId],
                destinationGasLimit: 500000,
                message: abi.encode(
                    CROSS_CHAIN_WARRIORS_MESSAGE_TYPE,
                    token,
                    // highlight-next-line
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

        // highlight-next-line
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

        // highlight-next-line
        _mintId(to, token);

        emit CrossChainWarriorsRevertedEvent(token, sender, to);
    }
}
