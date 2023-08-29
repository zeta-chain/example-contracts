// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@zetachain/protocol-contracts/contracts/zevm/SystemContract.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/zContract.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Staking is ERC20, zContract {
    error SenderNotSystemContract();
    error WrongChain();

    SystemContract public immutable systemContract;
    uint256 public immutable chain;

    mapping(address => uint256) public stakes;
    mapping(address => uint256) public lastStakeTime;
    uint256 public rewardRate = 1;

    constructor(
        string memory name,
        string memory symbol,
        uint256 chainID,
        address systemContractAddress
    ) ERC20(name, symbol) {
        systemContract = SystemContract(systemContractAddress);
        chain = chainID;
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

        address acceptedZRC20 = systemContract.gasCoinZRC20ByChainId(chain);
        if (zrc20 != acceptedZRC20) revert WrongChain();

        address recipient = abi.decode(message, (address));
        stakeZRC(recipient, amount);
    }

    function stakeZRC(address staker, uint256 amount) internal {
        updateRewards(staker);

        stakes[staker] += amount;
        lastStakeTime[staker] = block.timestamp;
    }

    function updateRewards(address staker) internal {
        uint256 timeDifference = block.timestamp - lastStakeTime[staker];
        uint256 rewardAmount = timeDifference * stakes[staker] * rewardRate;

        _mint(staker, rewardAmount);
    }

    function claimRewards() external {
        updateRewards(msg.sender);
        lastStakeTime[msg.sender] = block.timestamp;
    }

    function unstakeZRC(uint256 amount) external {
        updateRewards(msg.sender);

        require(stakes[msg.sender] >= amount, "Insufficient staked balance");

        address zrc20 = systemContract.gasCoinZRC20ByChainId(chain);

        (address gasZRC20, uint256 gasFee) = IZRC20(zrc20).withdrawGasFee();

        IZRC20(zrc20).approve(zrc20, gasFee);
        IZRC20(zrc20).withdraw(abi.encodePacked(msg.sender), amount - gasFee);

        stakes[msg.sender] -= amount;
        lastStakeTime[msg.sender] = block.timestamp;
    }

    function queryRewards(address account) public view returns (uint256) {
        uint256 timeDifference = block.timestamp - lastStakeTime[account];
        uint256 rewardAmount = timeDifference * stakes[account] * rewardRate;
        return rewardAmount;
    }
}
