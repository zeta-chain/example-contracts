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

    struct Giveaway {
        address creator;
        uint256 blockHeight;
        uint256 giveawayId;
        uint256 prizeAmount;
        uint256 maxParticipants;
        address nftContract;
    }

    struct Requirement {
        uint256 giveawayId;
        address nftContract;
    }

    mapping(uint256 => Giveaway) public giveaways;
    mapping(uint256 => Requirement) public requirements;
    mapping(uint256 => mapping(address => bool)) public participants;

    uint256 public giveawayCounter;

    ZetaTokenConsumer private immutable _zetaConsumer;
    IERC20 internal immutable _zetaToken;

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
        uint256 destinationChainId
    ) external payable {
        if (blockHeight <= block.number)
            revert("Block height must be in the future");
        if (prizeAmount <= 0) revert("Prize amount must be greater than 0");
        if (maxParticipants <= 0)
            revert("Max participants must be greater than 0");
        if (nftContract == address(0))
            revert("NFT contract address cannot be zero");

        if (!_isValidChainId(destinationChainId))
            revert InvalidDestinationChainId();

        giveaways[giveawayCounter] = Giveaway({
            creator: msg.sender,
            blockHeight: blockHeight,
            giveawayId: giveawayCounter,
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
        uint256 messageType = abi.decode(zetaMessage.message, (uint256));

        if (messageType == 1) {
            (, uint256 giveawayId, address nftContract) = abi.decode(
                zetaMessage.message,
                (uint256, uint256, address)
            );

            requirements[giveawayId] = Requirement({
                giveawayId: giveawayId,
                nftContract: nftContract
            });
        } else if (messageType == 2) {
            (, uint256 giveawayId, address participant) = abi.decode(
                zetaMessage.message,
                (uint256, uint256, address)
            );

            participants[giveawayId][participant] = true;
        }
    }

    function onZetaRevert(
        ZetaInterfaces.ZetaRevert calldata zetaRevert
    ) external override isValidRevertCall(zetaRevert) {
        string memory message = abi.decode(zetaRevert.message, (string));

        emit CrossChainMessageRevertedEvent(message);
    }

    function claim(uint256 giveawayId) external payable {
        Requirement memory requirement = requirements[giveawayId];
        if (requirement.nftContract == address(0))
            revert("Invalid giveaway ID");

        IERC721 nftContract = IERC721(requirement.nftContract);
        if (nftContract.balanceOf(msg.sender) == 0)
            revert("You do not own any NFT from the required collection");

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
                message: abi.encode(3, giveawayId, msg.sender),
                zetaValueAndGas: zetaValueAndGas,
                zetaParams: abi.encode("")
            })
        );

        emit ClaimedGiveaway(msg.sender, giveawayId);
    }

    function setRequirement(address nftContract) external onlyOwner {
        require(
            nftContract != address(0),
            "NFT contract address cannot be zero"
        );

        requirements[giveawayCounter] = Requirement({
            giveawayId: giveawayCounter,
            nftContract: nftContract
        });

        emit RequirementSet(giveawayCounter, nftContract);

        giveawayCounter++;
    }

    function participate(uint256 giveawayId) external payable {
        Requirement memory requirement = requirements[giveawayId];
        if (requirement.nftContract == address(0))
            revert("Invalid giveaway ID");

        IERC721 nftContract = IERC721(requirement.nftContract);
        if (nftContract.balanceOf(msg.sender) == 0)
            revert("You do not own any NFT from the required collection");

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
    }

    function hasNFT(
        address user,
        address nftContract
    ) public view returns (bool) {
        if (nftContract == address(0))
            revert("NFT contract address cannot be zero");

        IERC721 nft = IERC721(nftContract);
        return nft.balanceOf(user) > 0;
    }
}
