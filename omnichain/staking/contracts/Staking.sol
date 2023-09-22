// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@zetachain/protocol-contracts/contracts/zevm/SystemContract.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/zContract.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@zetachain/toolkit/contracts/BytesHelperLib.sol";

contract Staking is ERC20, zContract {
    error SenderNotSystemContract();
    error WrongChain();
    error UnknownAction();

    SystemContract public immutable systemContract;
    uint256 constant BITCOIN = 18332;

    uint256 public immutable chainID;
    uint256 public rewardRate = 1;

    mapping(address => uint256) public stakes;
    mapping(address => bytes) public withdrawAddresses;
    mapping(address => address) public beneficiaries;
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
    ) external override onlySystem {
        if (msg.sender != address(systemContract)) {
            revert SenderNotSystemContract();
        }

        if (chainID != context.chainID) {
            revert WrongChain();
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
            revert UnknownAction();
        }
    }

    function stakeZRC(address staker, uint256 amount) internal {
        stakes[staker] += amount;
        require(stakes[staker] >= amount, "Overflow detected");

        lastStakeTime[staker] = block.timestamp;
        updateRewards(staker);
    }

    function updateRewards(address staker) internal {
        uint256 rewardAmount = queryRewards(staker);

        _mint(beneficiaries[staker], rewardAmount);
        lastStakeTime[staker] = block.timestamp;
    }

    function unstakeZRC(address staker) internal {
        uint256 amount = stakes[staker];

        updateRewards(staker);

        address zrc20 = systemContract.gasCoinZRC20ByChainId(chainID);
        (, uint256 gasFee) = IZRC20(zrc20).withdrawGasFee();

        require(amount >= gasFee, "Amount should be greater than the gas fee");

        bytes memory recipient = withdrawAddresses[staker];

        IZRC20(zrc20).approve(zrc20, gasFee);
        IZRC20(zrc20).withdraw(recipient, amount - gasFee);

        stakes[staker] = 0;
        require(stakes[staker] <= amount, "Underflow detected");

        lastStakeTime[staker] = block.timestamp;
    }

    function setBeneficiary(address staker, bytes calldata message) internal {
        address beneficiary;
        if (chainID == BITCOIN) {
            beneficiary = BytesHelperLib.bytesToAddress(message, 1);
        } else {
            (, beneficiary) = abi.decode(message, (uint8, address));
        }
        beneficiaries[staker] = beneficiary;
    }

    function setWithdraw(
        address staker,
        bytes calldata message,
        bytes memory origin
    ) internal {
        bytes memory withdraw;
        if (chainID == BITCOIN) {
            withdraw = bytesToBech32Bytes(message, 1);
        } else {
            withdraw = origin;
        }
        withdrawAddresses[staker] = withdraw;
    }

    function queryRewards(address staker) public view returns (uint256) {
        uint256 timeDifference = block.timestamp - lastStakeTime[staker];
        uint256 rewardAmount = timeDifference * stakes[staker] * rewardRate;
        return rewardAmount;
    }

    function claimRewards(address staker) public {
        require(
            beneficiaries[staker] == msg.sender,
            "Not authorized to claim rewards"
        );
        uint256 rewardAmount = queryRewards(staker);
        require(rewardAmount > 0, "No rewards to claim");
        updateRewards(staker);
    }
}
