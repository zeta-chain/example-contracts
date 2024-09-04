// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./Mock4626.sol";

contract VaultManager {
    event DepositingIntoVault(uint256 amount);
    IERC20 public usdc;
    Mock4626 public vault;

    constructor(IERC20 _usdc, Mock4626 _vault) {
        usdc = _usdc;
        vault = _vault;
    }

    // Function to deposit USDC into the Mock4626 vault
    function depositIntoVault(uint256 amount) external {
        emit DepositingIntoVault(amount);
        require(amount > 0, "Amount must be greater than zero");

        // Approve the vault to spend USDC
        usdc.approve(address(vault), amount);

        // Deposit USDC into the vault
        vault.deposit(amount, address(this));
    }

    // Function to withdraw USDC from the Mock4626 vault
    function withdrawFromVault(uint256 amount) external {
        require(amount > 0, "Amount must be greater than zero");

        // Withdraw USDC from the vault
        vault.withdraw(amount, address(this), address(this));
    }
}
