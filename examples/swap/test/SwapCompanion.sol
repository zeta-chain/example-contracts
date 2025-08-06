// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@zetachain/protocol-contracts/contracts/evm/GatewayEVM.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract SwapCompanion {
    using SafeERC20 for IERC20;

    error ApprovalFailed();

    GatewayEVM public immutable gateway;

    constructor(address payable gatewayAddress) {
        gateway = GatewayEVM(gatewayAddress);
    }

    function swapNativeGas(
        address universalSwapContract,
        address targetToken,
        bytes memory recipient,
        bool withdraw
    ) public payable {
        gateway.depositAndCall{value: msg.value}(
            universalSwapContract,
            abi.encode(targetToken, recipient, withdraw),
            RevertOptions(msg.sender, false, address(0), "", 0)
        );
    }

    function swapERC20(
        address universalSwapContract,
        address targetToken,
        bytes memory recipient,
        uint256 amount,
        address asset,
        bool withdraw
    ) public {
        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);
        if (!IERC20(asset).approve(address(gateway), amount)) {
            revert ApprovalFailed();
        }
        gateway.depositAndCall(
            universalSwapContract,
            amount,
            asset,
            abi.encode(targetToken, recipient, withdraw),
            RevertOptions(msg.sender, false, address(0), "", 0)
        );
    }

    receive() external payable {}

    fallback() external payable {}
}
