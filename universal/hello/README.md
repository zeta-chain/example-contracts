# ZetaChain Contracts Template

## Getting Started

Install dependencies:

```
yarn
```

## Next Steps

## Deploying the contracts

Note: Remember to first run `npx hardhat compile —force` to make sure latest versions of contracts are being deployed.

The contracts have to be deployed in a specific order because there are some dependencies:

### MockUSDC

`npx hardhat deploy --network localhost --name MockUSDC`

This can be deployed at any time - it doesn’t take any constructor arguments

Latest address of `MockUSDC`: 0xE6E340D132b5f46d1e472DebcD681B2aBc16e57E

### Mock4626

`npx hardhat deploy --network localhost --name Mock4626 --conargs "MockUSDC address”`

This takes `_asset` as an constructor arguments, which for now is `MockUSDC`, so it needs to be deployed after `MockUSDC`

Latest address of `Mock4626`: 0xc3e53F4d16Ae77Db1c982e75a937B9f60FE63690

### ZRC4626

`npx hardhat deploy --network localhost --name ZRC4626 --conargs "testVault,TVT,MockUSDC address”`

This takes `name_`, `symbol_` and `asset_` as constructor arguments, in this case `asset_` is `MockUSDC`, so it needs to be deployed after `MockUSDC`

Latest address `ZRC4626`: 0x84eA74d481Ee0A5332c457a4d796187F6Ba67fEB

### VaultManager

`npx hardhat deploy --network localhost --name VaultManager --conargs "MockUSDC address,Mock4626 address”`

This takes `_usdc` and `_vault` as constructor arguments, where `_usdc` is `MockUSDC`, and `_vault` is `Mock4626`, so it needs to be deployed after these two contracts

Latest address `VaultManager`: 0x9E545E3C0baAB3E08CdfD552C960A1050f373042

Once the contracts have been deployed (or if `VaultManager` is redeployed), I need to mint some `MockUSDC` into the `VaultManager` (since the functionality to transfer it from Zetachain is not yet there)

`npx hardhat mint-usdc --network localhost --usdc-address 0x9A9f2CCfdE556A7E9Ff0848998Aa4a0CFD8863AE --vault-manager-address 0xc6e7DF5E7b4f2A278906862b61205850344D4e7d`

You can check the USDC balance of VaultManager at any point by calling:

`npx hardhat check-balance --network localhost --erc20-address 0x7a2088a1bFc9d81c55368AE168C2C02570cB814F --account 0xE6E340D132b5f46d1e472DebcD681B2aBc16e57E --decimals 6`

## Making a Deposit

The process of making a deposit involves depositing from the EVM chain, via the EVM Gateway, into the `ZRC4626` universal app on Zetachain, which in turn makes a call to `VaultManager`, which in turn deposits `MockUSDC` into the `Mock4626` vault.

The deposit call (either from the hardhat task or a FE UI) triggers the `onCrossChainCall` function in `ZRC4626`.

`onCrossChainCall` takes the following parameters:

```jsx
        zContext calldata context, (sender addr and sending chain)
        address zrc20, // ZRC-20 address of the deposited tokens (for example, contract address of ZRC-20 ETH
        uint256 amount, //amount that came in
        bytes calldata message // message that was sent with the depositAndCall
```

The call that I’m making is this:

`yarn hardhat deposit-and-call --contract ZRC4626_address --amount 2 --message VaultManager_address --revert-address 0x9A676e781A523b5d0C0e43731313A708CB607508 --revert-message 0x --call-on-revert`
