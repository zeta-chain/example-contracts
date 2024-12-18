// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@zetachain/protocol-contracts/contracts/zevm/GatewayZEVM.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";

contract Universal is UniversalContract, Ownable2Step {
    GatewayZEVM public immutable gateway;

    mapping(address => address) public connected;
    mapping(address => mapping(address => uint256)) public checkIns;
    mapping(address => mapping(address => uint256)) public lastCheckInBlock;

    uint256 public blocksDelay = 20;

    event CheckIn(
        address indexed user,
        address indexed chainIdentifier,
        uint256 count,
        uint256 blockNumber
    );

    error Unauthorized();
    error InvalidAddress();
    error CheckInTooSoon();

    modifier onlyGateway() {
        if (msg.sender != address(gateway)) revert Unauthorized();
        _;
    }

    constructor(address payable gatewayAddress, address owner) Ownable(owner) {
        if (gatewayAddress == address(0)) revert InvalidAddress();
        gateway = GatewayZEVM(gatewayAddress);
    }

    function setBlocksDelay(uint256 newBlocksDelay) external onlyOwner {
        blocksDelay = newBlocksDelay;
    }

    function setConnected(
        address zrc20,
        address contractAddress
    ) external onlyOwner {
        connected[zrc20] = contractAddress;
    }

    function onCall(
        MessageContext calldata context,
        address zrc20,
        uint256 amount,
        bytes calldata message
    ) external override onlyGateway {
        if (context.sender != connected[zrc20]) revert Unauthorized();

        address sender = abi.decode(message, (address));
        uint256 currentBlock = block.number;

        if (currentBlock < lastCheckInBlock[sender][zrc20] + blocksDelay) {
            revert CheckInTooSoon();
        }

        checkIns[sender][zrc20] += 1;
        lastCheckInBlock[sender][zrc20] = currentBlock;

        emit CheckIn(sender, zrc20, checkIns[sender][zrc20], currentBlock);
    }
}
