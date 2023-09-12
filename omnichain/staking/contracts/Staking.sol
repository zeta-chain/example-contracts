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
    mapping(address => address) public beneficiaries;
    mapping(address => uint256) public lastStakeTime;
    uint256 public rewardRate = 1;

    event Staked(
        address indexed staker,
        address indexed beneficiary,
        uint256 amount
    );
    event RewardsClaimed(address indexed staker, uint256 rewardAmount);
    event Unstaked(address indexed staker, uint256 amount);

    constructor(
        string memory name_,
        string memory symbol_,
        uint256 chainID_,
        address systemContractAddress
    ) ERC20(name_, symbol_) {
        systemContract = SystemContract(systemContractAddress);
        chainID = chainID_;
    }

    function onCrossChainCall(
        zContext calldata context,
        address zrc20,
        uint256 amount,
        bytes calldata message
    ) external override {
        if (msg.sender != address(systemContract)) {
            revert SenderNotSystemContract();
        }

        address acceptedZRC20 = systemContract.gasCoinZRC20ByChainId(chainID);
        if (zrc20 != acceptedZRC20) revert WrongChain();

        address staker = BytesHelperLib.bytesToAddress(context.origin, 0);
        address beneficiary;
        uint32 action;

        if (context.chainID == 18332) {
            beneficiary = BytesHelperLib.bytesToAddress(message, 0);
            action = BytesHelperLib.bytesToUint32(message, 20);
        } else {
            (beneficiary, action) = abi.decode(message, (address, uint32));
        }

        if (action == 1) {
            stakeZRC(staker, beneficiary, amount);
        } else if (action == 2) {
            unstakeZRC(staker, amount);
        } else {
            revert UnknownAction();
        }
    }

    function stakeZRC(
        address staker,
        address beneficiary,
        uint256 amount
    ) internal {
        stakes[staker] += amount;
        require(stakes[staker] >= amount, "Overflow detected");

        if (beneficiaries[staker] == address(0)) {
            beneficiaries[staker] = beneficiary;
        }

        lastStakeTime[staker] = block.timestamp;
        updateRewards(staker);

        emit Staked(staker, beneficiary, amount);
    }

    function updateRewards(address staker) internal {
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

    function unstakeZRC(address staker, uint256 amount) internal {
        require(stakes[staker] >= amount, "Insufficient staked balance");

        updateRewards(staker);

        address zrc20 = systemContract.gasCoinZRC20ByChainId(chainID);
        (address gasZRC20, uint256 gasFee) = IZRC20(zrc20).withdrawGasFee();

        require(amount >= gasFee, "Amount should be greater than the gas fee");

        IZRC20(zrc20).approve(zrc20, gasFee);

        bytes memory recipient;
        if (chainID == 18332) {
            recipient = abi.encodePacked(BytesHelperLib.addressToBytes(staker));
        } else {
            recipient = abi.encodePacked(staker);
        }

        IZRC20(zrc20).withdraw(recipient, amount - gasFee);
        stakes[staker] -= amount;
        require(stakes[staker] <= amount, "Underflow detected");

        lastStakeTime[staker] = block.timestamp;

        emit Unstaked(staker, amount);
    }

    function queryRewards(address account) public view returns (uint256) {
        uint256 timeDifference = block.timestamp - lastStakeTime[account];
        uint256 rewardAmount = timeDifference * stakes[account] * rewardRate;
        return rewardAmount;
    }
}
