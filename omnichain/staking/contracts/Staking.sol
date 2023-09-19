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

    mapping(bytes => uint256) public stakes;
    mapping(bytes => bytes) public withdraw;
    mapping(bytes => address) public beneficiaries;
    mapping(bytes => uint256) public lastStakeTime;
    uint256 public rewardRate = 1;

    event Staked(bytes indexed staker, uint256 amount);
    event RewardsClaimed(bytes indexed staker, uint256 rewardAmount);
    event Unstaked(bytes indexed staker, uint256 amount);
    event OnCrossChainCallEvent(bytes staker, uint32 action);

    event StakeZRC(bytes indexed staker, uint256 amount);
    event UnstakeZRC(bytes indexed staker);
    event SetBeneficiary(bytes indexed staker, address beneficiaryAddress);
    event SetWithdraw(bytes indexed staker, bytes withdrawAddress);

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
        bytes memory data,
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
        bytes memory stakerAddress;
        address beneficiaryAddress;
        uint8 action = uint8(message[0]);

        if (action == 1) {
            emit StakeZRC(context.origin, amount);
            stakeZRC(context.origin, amount);
        } else if (action == 2) {
            emit UnstakeZRC(context.origin);
            unstakeZRC(context.origin);
        } else if (action == 3) {
            beneficiaryAddress = BytesHelperLib.bytesToAddress(message, 1);
            emit SetBeneficiary(context.origin, beneficiaryAddress);
            setBeneficiary(context.origin, beneficiaryAddress);
        } else if (action == 4) {
            withdrawAddress = bytesToBech32Bytes(message, 1);
            emit SetWithdraw(context.origin, withdrawAddress);
            setWithdraw(context.origin, withdrawAddress);
        } else {
            revert UnknownAction();
        }
    }

    function stakeZRC(bytes memory stakerAddress, uint256 amount) public {
        stakes[stakerAddress] += amount;
        require(stakes[stakerAddress] >= amount, "Overflow detected");

        lastStakeTime[stakerAddress] = block.timestamp;
        updateRewards(stakerAddress);

        emit Staked(stakerAddress, amount);
    }

    function setBeneficiary(
        bytes memory stakerAddress,
        address beneficiaryAddress
    ) public {
        beneficiaries[stakerAddress] = beneficiaryAddress;
    }

    function setWithdraw(
        bytes memory stakerAddress,
        bytes memory withdrawAddress
    ) public {
        withdraw[stakerAddress] = withdrawAddress;
    }

    function updateRewards(bytes memory staker) public {
        uint256 timeDifference = block.timestamp - lastStakeTime[staker];
        uint256 rewardAmount = timeDifference * stakes[staker] * rewardRate;
        require(rewardAmount >= timeDifference, "Overflow detected");

        _mint(beneficiaries[staker], rewardAmount);
        lastStakeTime[staker] = block.timestamp;
    }

    function claimRewards(bytes memory staker) external {
        require(
            beneficiaries[staker] == msg.sender,
            "Not authorized to claim rewards"
        );
        uint256 rewardAmount = queryRewards(staker);
        require(rewardAmount > 0, "No rewards to claim");
        updateRewards(staker);
        emit RewardsClaimed(staker, rewardAmount);
    }

    function unstakeZRC(bytes memory staker) public {
        uint256 amount = stakes[staker];

        updateRewards(staker);

        address zrc20 = systemContract.gasCoinZRC20ByChainId(chainID);
        (, uint256 gasFee) = IZRC20(zrc20).withdrawGasFee();

        require(amount >= gasFee, "Amount should be greater than the gas fee");

        IZRC20(zrc20).approve(zrc20, gasFee);

        bytes memory recipient;
        if (chainID == 18332) {
            recipient = abi.encodePacked(staker);
        } else {
            recipient = abi.encodePacked(staker);
        }

        IZRC20(zrc20).withdraw(recipient, amount - gasFee);
        stakes[staker] = 0;
        require(stakes[staker] <= amount, "Underflow detected");

        lastStakeTime[staker] = block.timestamp;

        emit Unstaked(staker, amount);
    }

    function queryRewards(bytes memory staker) public view returns (uint256) {
        uint256 timeDifference = block.timestamp - lastStakeTime[staker];
        uint256 rewardAmount = timeDifference * stakes[staker] * rewardRate;
        return rewardAmount;
    }
}
