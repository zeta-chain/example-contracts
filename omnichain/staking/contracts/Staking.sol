// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@zetachain/protocol-contracts/contracts/zevm/SystemContract.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/zContract.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@zetachain/toolkit/contracts/BytesHelperLib.sol";

contract Staking is ERC20, zContract {
    error SenderNotSystemContract();
    error WrongChain(uint256 chainID);
    error UnknownAction(uint8 action);
    error Overflow();
    error Underflow();
    error WrongAmount();
    error NotAuthorized();
    error NoRewardsToClaim();

    SystemContract public immutable systemContract;
    uint256 public immutable chainID;
    uint256 constant BITCOIN = 18332;

    uint256 public rewardRate = 1;

    mapping(address => uint256) public stake;
    mapping(address => bytes) public withdraw;
    mapping(address => address) public beneficiary;
    mapping(address => uint256) public lastStakeTime;

    constructor(
        string memory name_,
        string memory symbol_,
        uint256 chainID_,
        address systemContractAddress
    ) ERC20(name_, symbol_) {
        systemContract = SystemContract(systemContractAddress);
        chainID = chainID_;
    }

    modifier onlySystem() {
        require(
            msg.sender == address(systemContract),
            "Only system contract can call this function"
        );
        _;
    }

    function onCrossChainCall(
        zContext calldata context,
        address zrc20,
        uint256 amount,
        bytes calldata message
    ) external override onlySystem {
        if (chainID != context.chainID) {
            revert WrongChain(context.chainID);
        }

        address staker = BytesHelperLib.bytesToAddress(context.origin, 0);

        uint8 action = chainID == BITCOIN
            ? uint8(message[0])
            : abi.decode(message, (uint8));

        if (action == 1) {
            stakeZRC(staker, amount);
        } else if (action == 2) {
            unstakeZRC(staker);
        } else if (action == 3) {
            setBeneficiary(staker, message);
        } else if (action == 4) {
            setWithdraw(staker, message, context.origin);
        } else {
            revert UnknownAction(action);
        }
    }

    function stakeZRC(address staker, uint256 amount) internal {
        stake[staker] += amount;
        if (stake[staker] < amount) revert Overflow();

        lastStakeTime[staker] = block.timestamp;
        updateRewards(staker);
    }

    function updateRewards(address staker) internal {
        uint256 rewardAmount = queryRewards(staker);

        _mint(beneficiary[staker], rewardAmount);
        lastStakeTime[staker] = block.timestamp;
    }

    function unstakeZRC(address staker) internal {
        uint256 amount = stake[staker];

        updateRewards(staker);

        address zrc20 = systemContract.gasCoinZRC20ByChainId(chainID);
        (, uint256 gasFee) = IZRC20(zrc20).withdrawGasFee();

        if (amount < gasFee) revert WrongAmount();

        bytes memory recipient = withdraw[staker];

        stake[staker] = 0;

        IZRC20(zrc20).approve(zrc20, gasFee);
        IZRC20(zrc20).withdraw(recipient, amount - gasFee);

        if (stake[staker] > amount) revert Underflow();

        lastStakeTime[staker] = block.timestamp;
    }

    function setBeneficiary(address staker, bytes calldata message) internal {
        address beneficiaryAddress;
        if (chainID == BITCOIN) {
            beneficiaryAddress = BytesHelperLib.bytesToAddress(message, 1);
        } else {
            (, beneficiaryAddress) = abi.decode(message, (uint8, address));
        }
        beneficiary[staker] = beneficiaryAddress;
    }

    function setWithdraw(
        address staker,
        bytes calldata message,
        bytes memory origin
    ) internal {
        bytes memory withdrawAddress;
        if (chainID == BITCOIN) {
            withdrawAddress = BytesHelperLib.bytesToBech32Bytes(message, 1);
        } else {
            withdrawAddress = origin;
        }
        withdraw[staker] = withdrawAddress;
    }

    function queryRewards(address staker) public view returns (uint256) {
        uint256 timeDifference = block.timestamp - lastStakeTime[staker];
        uint256 rewardAmount = timeDifference * stake[staker] * rewardRate;
        return rewardAmount;
    }

    function claimRewards(address staker) external {
        if (beneficiary[staker] != msg.sender) revert NotAuthorized();
        uint256 rewardAmount = queryRewards(staker);
        if (rewardAmount <= 0) revert NoRewardsToClaim();
        updateRewards(staker);
    }
}
