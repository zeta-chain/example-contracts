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
    mapping(bytes => address) public beneficiaries;
    mapping(bytes => uint256) public lastStakeTime;
    uint256 public rewardRate = 1;

    event Staked(
        bytes indexed staker,
        address indexed beneficiary,
        uint256 amount
    );
    event RewardsClaimed(bytes indexed staker, uint256 rewardAmount);
    event Unstaked(bytes indexed staker, uint256 amount);
    event OnCrossChainCallEvent(
        bytes staker,
        address beneficiary,
        uint32 action
    );

    event Logging(string);

    constructor(
        string memory name_,
        string memory symbol_,
        uint256 chainID_,
        address systemContractAddress
    ) ERC20(name_, symbol_) {
        systemContract = SystemContract(systemContractAddress);
        chainID = chainID_;
    }

    function decode(
        bytes memory message
    ) public pure returns (bytes memory bech32, address hexAddr, uint32 value) {
        require(message.length == 66, "Invalid message length"); // 42 (bech32) + 20 (address) + 4 (uint32)

        bytes memory bech32Bytes = new bytes(42);

        for (uint256 i = 0; i < bech32Bytes.length; i++) {
            bech32Bytes[i] = message[i];
        }

        bech32 = bech32Bytes;

        assembly {
            hexAddr := mload(add(message, 42))
            value := mload(add(message, 62))
        }

        return (bech32, hexAddr, value);
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

        emit Logging("onCrossChainCall");

        address acceptedZRC20 = systemContract.gasCoinZRC20ByChainId(chainID);
        if (zrc20 != acceptedZRC20) revert WrongChain();

        bytes memory staker;
        address beneficiary;
        uint32 action;

        if (context.chainID == 18332) {
            (staker, beneficiary, action) = decode(message);
        } else {
            (staker, beneficiary, action) = abi.decode(
                message,
                (bytes, address, uint32)
            );
        }

        emit OnCrossChainCallEvent(staker, beneficiary, action);

        if (action == 1) {
            stakeZRC(staker, beneficiary, amount);
        } else if (action == 2) {
            unstakeZRC(staker);
        } else {
            revert UnknownAction();
        }
    }

    function stakeZRC(
        bytes memory staker,
        address beneficiary,
        uint256 amount
    ) internal {
        emit Logging("stakeZRC");
        stakes[staker] += amount;
        require(stakes[staker] >= amount, "Overflow detected");

        if (beneficiaries[staker] == address(0)) {
            beneficiaries[staker] = beneficiary;
        }

        lastStakeTime[staker] = block.timestamp;
        updateRewards(staker);

        emit Staked(staker, beneficiary, amount);
    }

    function updateRewards(bytes memory staker) internal {
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

    function unstakeZRC(bytes memory staker) internal {
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
