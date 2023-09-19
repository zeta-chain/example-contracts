// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@zetachain/protocol-contracts/contracts/zevm/SystemContract.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/zContract.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@zetachain/toolkit/contracts/BytesHelperLib.sol";

contract Staking is ERC20, zContract {
    error SenderNotSystemContract();
    error WrongChain();
    error NotAuthorizedToClaim();
    error UnknownAction();

    SystemContract public immutable systemContract;
    uint256 public immutable chainID;

    mapping(address => uint256) public stakes;
    mapping(address => bytes) public withdraw;
    mapping(address => address) public beneficiaries;
    mapping(address => uint256) public lastStakeTime;
    uint256 public rewardRate = 1;

    event Staked(address indexed staker, uint256 amount);
    event RewardsClaimed(address indexed staker, uint256 rewardAmount);
    event Unstaked(address indexed staker, uint256 amount);
    event OnCrossChainCallEvent(address staker, uint32 action);

    event StakeZRC(address indexed staker, uint256 amount);
    event UnstakeZRC(address indexed staker);
    event SetBeneficiary(address indexed staker, address beneficiaryAddress);
    event SetWithdraw(address indexed staker, bytes withdrawAddress);

    constructor(
        string memory name_,
        string memory symbol_,
        uint256 chainID_,
        address systemContractAddress
    ) ERC20(name_, symbol_) {
        systemContract = SystemContract(systemContractAddress);
        chainID = chainID_;
    }

    function bytesToBech32Bytes(
        bytes calldata data,
        uint256 offset
    ) public pure returns (bytes memory) {
        bytes memory bech32Bytes = new bytes(42);
        for (uint i = 0; i < 42; i++) {
            bech32Bytes[i] = data[i + offset];
        }

        return bech32Bytes;
    }

    function onCrossChainCall(
        zContext calldata context,
        address zrc20,
        uint256 amount,
        bytes calldata message
    ) external override {
        bytes memory withdrawAddress;
        address stakerAddress = BytesHelperLib.bytesToAddress(
            context.origin,
            0
        );
        address beneficiaryAddress;
        uint8 action = uint8(message[0]);

        if (action == 1) {
            emit StakeZRC(stakerAddress, amount);
            stakeZRC(stakerAddress, amount);
        } else if (action == 2) {
            unstakeZRC(stakerAddress);
        } else if (action == 3) {
            beneficiaryAddress = BytesHelperLib.bytesToAddress(message, 1);
            setBeneficiary(stakerAddress, beneficiaryAddress);
        } else if (action == 4) {
            withdrawAddress = bytesToBech32Bytes(message, 1);
            setWithdraw(stakerAddress, withdrawAddress);
        } else {
            revert UnknownAction();
        }
    }

    function stakeZRC(address stakerAddress, uint256 amount) public {
        emit StakeZRC(stakerAddress, amount);
        stakes[stakerAddress] += amount;
        require(stakes[stakerAddress] >= amount, "Overflow detected");

        lastStakeTime[stakerAddress] = block.timestamp;
        updateRewards(stakerAddress);

        emit Staked(stakerAddress, amount);
    }

    function setBeneficiary(
        address stakerAddress,
        address beneficiaryAddress
    ) public {
        beneficiaries[stakerAddress] = beneficiaryAddress;
        emit SetBeneficiary(stakerAddress, beneficiaryAddress);
    }

    function setWithdraw(
        address stakerAddress,
        bytes memory withdrawAddress
    ) public {
        withdraw[stakerAddress] = withdrawAddress;
        emit SetWithdraw(stakerAddress, withdrawAddress);
    }

    function updateRewards(address staker) public {
        uint256 timeDifference = block.timestamp - lastStakeTime[staker];
        uint256 rewardAmount = timeDifference * stakes[staker] * rewardRate;
        require(rewardAmount >= timeDifference, "Overflow detected");

        _mint(beneficiaries[staker], rewardAmount);
        lastStakeTime[staker] = block.timestamp;
    }

    function claimRewards(address staker) external {
        require(
            beneficiaries[staker] == msg.sender,
            "Not authorized to claim rewards"
        );
        uint256 rewardAmount = queryRewards(staker);
        require(rewardAmount > 0, "No rewards to claim");
        updateRewards(staker);
        emit RewardsClaimed(staker, rewardAmount);
    }

    function unstakeZRC(address staker) public {
        uint256 amount = stakes[staker];

        updateRewards(staker);

        address zrc20 = systemContract.gasCoinZRC20ByChainId(chainID);
        (, uint256 gasFee) = IZRC20(zrc20).withdrawGasFee();

        require(amount >= gasFee, "Amount should be greater than the gas fee");

        IZRC20(zrc20).approve(zrc20, gasFee);

        bytes memory recipient = withdraw[staker];

        IZRC20(zrc20).withdraw(recipient, amount - gasFee);
        stakes[staker] = 0;
        require(stakes[staker] <= amount, "Underflow detected");

        lastStakeTime[staker] = block.timestamp;

        emit Unstaked(staker, amount);
    }

    function queryRewards(address staker) public view returns (uint256) {
        uint256 timeDifference = block.timestamp - lastStakeTime[staker];
        uint256 rewardAmount = timeDifference * stakes[staker] * rewardRate;
        return rewardAmount;
    }
}
