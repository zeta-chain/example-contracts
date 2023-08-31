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

    SystemContract public immutable systemContract;
    uint256 public immutable chain;

    mapping(address => uint256) public stakes;
    mapping(address => address) public beneficiaries;
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

        address staker = BytesHelperLib.bytesToAddress(context.origin, 0);
        address beneficiary = abi.decode(message, (address));

        stakeZRC(staker, beneficiary, amount);
    }

    function stakeZRC(
        address staker,
        address beneficiary,
        uint256 amount
    ) internal {
        updateRewards(staker, beneficiary);

        stakes[staker] += amount;
        beneficiaries[staker] = beneficiary;
        lastStakeTime[staker] = block.timestamp;
    }

    function updateRewards(address staker, address recipient) internal {
        uint256 timeDifference = block.timestamp - lastStakeTime[staker];
        uint256 rewardAmount = timeDifference * stakes[staker] * rewardRate;

        _mint(recipient, rewardAmount);
    }

    function claimRewards(address staker) external {
        if (beneficiaries[staker] != msg.sender) {
            revert NotAuthorizedToClaim();
        }

        updateRewards(staker, msg.sender);
        lastStakeTime[msg.sender] = block.timestamp;
    }

    function unstakeZRC(uint256 amount) external {
        updateRewards(msg.sender, msg.sender);

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
