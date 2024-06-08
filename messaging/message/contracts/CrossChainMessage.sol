// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@zetachain/protocol-contracts/contracts/evm/tools/ZetaInteractor.sol";
import "@zetachain/protocol-contracts/contracts/evm/interfaces/ZetaInterfaces.sol";

contract CrossChainMessage is ZetaInteractor, ZetaReceiver {
    event CrossChainMessageRevertedEvent(string);
    event GiveawayCreated(
        address indexed creator,
        uint256 blockHeight,
        uint256 prizeAmount,
        uint256 maxParticipants,
        address nftContract
    );
    event CrossChainMessageEvent(
        uint256 messageType,
        bytes32 giveawayId,
        address nftContract
    );

    struct Giveaway {
        address creator;
        uint256 blockHeight;
        uint256 prizeAmount;
        uint256 maxParticipants;
        address nftContract;
    }

    struct Requirement {
        bytes32 giveawayId;
        address nftContract;
    }

    mapping(bytes32 => Giveaway) public giveaways;
    mapping(bytes32 => Requirement) public requirements;

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

    function createGiveaway(
        uint256 blockHeight,
        uint256 prizeAmount,
        uint256 maxParticipants,
        address nftContract,
        uint256 destinationChainId
    ) external payable {
        require(
            blockHeight > block.number,
            "Block height must be in the future"
        );
        require(prizeAmount > 0, "Prize amount must be greater than 0");
        require(maxParticipants > 0, "Max participants must be greater than 0");
        require(
            nftContract != address(0),
            "NFT contract address cannot be zero"
        );

        if (!_isValidChainId(destinationChainId))
            revert InvalidDestinationChainId();

        bytes32 giveawayId = keccak256(
            abi.encodePacked(
                msg.sender,
                blockHeight,
                prizeAmount,
                maxParticipants,
                nftContract
            )
        );
        giveaways[giveawayId] = Giveaway({
            creator: msg.sender,
            blockHeight: blockHeight,
            prizeAmount: prizeAmount,
            maxParticipants: maxParticipants,
            nftContract: nftContract
        });

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
                message: abi.encode(1, giveawayId, nftContract),
                zetaValueAndGas: zetaValueAndGas,
                zetaParams: abi.encode("")
            })
        );

        emit GiveawayCreated(
            msg.sender,
            blockHeight,
            prizeAmount,
            maxParticipants,
            nftContract
        );
    }

    function onZetaMessage(
        ZetaInterfaces.ZetaMessage calldata zetaMessage
    ) external override {
        (uint256 messageType, bytes32 giveawayId, address nftContract) = abi
            .decode(zetaMessage.message, (uint256, bytes32, address));

        if (messageType == 1) {
            requirements[giveawayId] = Requirement({
                giveawayId: giveawayId,
                nftContract: nftContract
            });
        }
    }

    function onZetaRevert(
        ZetaInterfaces.ZetaRevert calldata zetaRevert
    ) external override isValidRevertCall(zetaRevert) {
        string memory message = abi.decode(zetaRevert.message, (string));

        emit CrossChainMessageRevertedEvent(message);
    }
}
