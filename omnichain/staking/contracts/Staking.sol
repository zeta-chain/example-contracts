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
        address staker = BytesHelperLib.bytesToAddress(context.origin, 0);
        address beneficiary;
        uint8 action;
        if (chainID == 18332) {
            action = uint8(message[0]);
        } else {
            action = abi.decode(message, (uint8));
        }

        if (action == 1) {
            stakeZRC(staker, amount);
        } else if (action == 2) {
            unstakeZRC(staker);
        } else if (action == 3) {
            if (chainID == 18332) {
                beneficiary = BytesHelperLib.bytesToAddress(message, 1);
            } else {
                (, beneficiary) = abi.decode(message, (uint8, address));
            }
            beneficiaries[staker] = beneficiary;
        } else if (action == 4) {
            if (chainID == 18332) {
                withdrawAddress = bytesToBech32Bytes(message, 1);
            } else {
                withdrawAddress = context.origin;
            }
            withdraw[staker] = withdrawAddress;
        } else {
            revert UnknownAction();
        }
    }

    function stakeZRC(address staker, uint256 amount) public {
        stakes[staker] += amount;
        require(stakes[staker] >= amount, "Overflow detected");

        lastStakeTime[staker] = block.timestamp;
        updateRewards(staker);
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
    }

    function queryRewards(address staker) public view returns (uint256) {
        uint256 timeDifference = block.timestamp - lastStakeTime[staker];
        uint256 rewardAmount = timeDifference * stakes[staker] * rewardRate;
        return rewardAmount;
    }
}
