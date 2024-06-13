// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@zetachain/protocol-contracts/contracts/evm/tools/ZetaInteractor.sol";
import "@zetachain/protocol-contracts/contracts/evm/interfaces/ZetaInterfaces.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract CrossChainMessage is ZetaInteractor, ZetaReceiver {
    event CrossChainMessageRevertedEvent(string);
    event GiveawayCreated(
        address indexed creator,
        uint256 blockHeight,
        uint256 prizeAmount,
        uint256 maxParticipants,
        address nftContract,
        uint256 giveawayId
    );
    event CrossChainMessageEvent(
        uint256 messageType,
        uint256 giveawayId,
        address nftContract
    );
    event ClaimedGiveaway(address indexed participant, uint256 giveawayId);
    event RequirementSet(uint256 giveawayId, address nftContract);
    event Participation(
        uint256 indexed giveawayId,
        address indexed participant
    );

    struct Giveaway {
        address creator;
        uint256 blockHeight;
        uint256 giveawayId;
        uint256 prizeAmount;
        uint256 maxParticipants;
        address nftContract;
        bool completed;
        string title;
    }

    mapping(uint256 => Giveaway) public giveaways;
    mapping(uint256 => address) public requirements;
    mapping(uint256 => mapping(uint256 => address)) public participants;
    mapping(uint256 => uint256) public participantCounters;

    uint256 public giveawayCounter;

    ZetaTokenConsumer private immutable _zetaConsumer;
    IERC20 internal immutable _zetaToken;

    error BlockHeightInFuture();
    error PrizeAmountGreaterThanZero();
    error MaxParticipantsGreaterThanZero();
    error NFTContractAddressNotZero();
    error InvalidMessageType();
    error InvalidGiveawayID();
    error UserDoesNotOwnRequiredNFT();
    error InsufficientValueProvided();
    error GiveawayAlreadyCompleted();

    constructor(
        address connectorAddress,
        address zetaTokenAddress,
        address zetaConsumerAddress
    ) ZetaInteractor(connectorAddress) {
        _zetaToken = IERC20(zetaTokenAddress);
        _zetaConsumer = ZetaTokenConsumer(zetaConsumerAddress);
        giveawayCounter = 0;
    }

    function createGiveaway(
        uint256 blockHeight,
        uint256 prizeAmount,
        uint256 maxParticipants,
        address nftContract,
        uint256 destinationChainId,
        string memory title
    ) external payable {
        if (blockHeight <= block.number) revert BlockHeightInFuture();
        if (prizeAmount <= 0) revert PrizeAmountGreaterThanZero();
        if (maxParticipants <= 0) revert MaxParticipantsGreaterThanZero();
        if (nftContract == address(0)) revert NFTContractAddressNotZero();

        if (!_isValidChainId(destinationChainId))
            revert InvalidDestinationChainId();

        giveaways[giveawayCounter] = Giveaway({
            creator: msg.sender,
            blockHeight: blockHeight,
            giveawayId: giveawayCounter,
            prizeAmount: prizeAmount,
            maxParticipants: maxParticipants,
            nftContract: nftContract,
            completed: false,
            title: title
        });

        uint256 crossChainGas = 3 * (10 ** 18);
        uint256 zetaValueAndGas = _zetaConsumer.getZetaFromEth{
            value: msg.value
        }(address(this), crossChainGas);

        uint256 requiredValue = crossChainGas + prizeAmount * maxParticipants;
        if (msg.value <= requiredValue) revert InsufficientValueProvided();

        _zetaToken.approve(address(connector), zetaValueAndGas);

        connector.send(
            ZetaInterfaces.SendInput({
                destinationChainId: destinationChainId,
                destinationAddress: interactorsByChainId[destinationChainId],
                destinationGasLimit: 300000,
                message: abi.encode(1, giveawayCounter, nftContract),
                zetaValueAndGas: zetaValueAndGas,
                zetaParams: abi.encode("")
            })
        );

        emit GiveawayCreated(
            msg.sender,
            blockHeight,
            prizeAmount,
            maxParticipants,
            nftContract,
            giveawayCounter
        );

        giveawayCounter++;
    }

    function onZetaMessage(
        ZetaInterfaces.ZetaMessage calldata zetaMessage
    ) external override {
        (uint256 messageType, uint256 giveawayId, address addr) = abi.decode(
            zetaMessage.message,
            (uint256, uint256, address)
        );

        if (messageType == 1) {
            requirements[giveawayId] = addr;
        } else if (messageType == 2) {
            uint256 participantId = participantCounters[giveawayId]++;
            participants[giveawayId][participantId] = addr;
        } else {
            revert InvalidMessageType();
        }
    }

    function onZetaRevert(
        ZetaInterfaces.ZetaRevert calldata zetaRevert
    ) external override isValidRevertCall(zetaRevert) {
        string memory message = abi.decode(zetaRevert.message, (string));

        emit CrossChainMessageRevertedEvent(message);
    }

    function participate(uint256 giveawayId) external payable {
        address nftContractAddress = requirements[giveawayId];
        if (nftContractAddress == address(0)) revert InvalidGiveawayID();

        IERC721 nftContract = IERC721(nftContractAddress);
        if (nftContract.balanceOf(msg.sender) == 0)
            revert UserDoesNotOwnRequiredNFT();

        uint256 crossChainGas = 2 * (10 ** 18);
        uint256 zetaValueAndGas = _zetaConsumer.getZetaFromEth{
            value: msg.value
        }(address(this), crossChainGas);
        _zetaToken.approve(address(connector), zetaValueAndGas);

        connector.send(
            ZetaInterfaces.SendInput({
                destinationChainId: 7001,
                destinationAddress: interactorsByChainId[7001],
                destinationGasLimit: 300000,
                message: abi.encode(2, giveawayId, msg.sender),
                zetaValueAndGas: zetaValueAndGas,
                zetaParams: abi.encode("")
            })
        );

        emit Participation(giveawayId, msg.sender);
    }

    function hasNFT(
        address user,
        address nftContract
    ) public view returns (bool) {
        if (nftContract == address(0)) revert NFTContractAddressNotZero();

        IERC721 nft = IERC721(nftContract);
        return nft.balanceOf(user) > 0;
    }

    function getParticipants(
        uint256 giveawayId
    ) external view returns (address[] memory) {
        uint256 count = participantCounters[giveawayId];
        address[] memory _participants = new address[](count);
        for (uint256 i = 0; i < count; i++) {
            _participants[i] = participants[giveawayId][i];
        }
        return _participants;
    }

    function distributeRewards(uint256 giveawayId) external {
        Giveaway storage giveaway = giveaways[giveawayId];

        if (giveaway.completed) revert GiveawayAlreadyCompleted();

        uint256 participantCount = participantCounters[giveawayId];

        for (uint256 i = 0; i < participantCount; i++) {
            address participant = participants[giveawayId][i];
            require(
                _zetaToken.transfer(participant, giveaway.prizeAmount),
                "Transfer failed"
            );
        }

        giveaway.completed = true;
    }
}
