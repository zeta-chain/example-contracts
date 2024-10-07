# Hello Example

```
yarn deploy
```

## EVM

Successful call:

```
npx hardhat echo-call --contract 0xE6E340D132b5f46d1e472DebcD681B2aBc16e57E --receiver 0xc3e53F4d16Ae77Db1c982e75a937B9f60FE63690 --network localhost --types '["string"]' hello
```

Failed call:

```
npx hardhat echo-call --contract 0xE6E340D132b5f46d1e472DebcD681B2aBc16e57E --receiver 0xc3e53F4d16Ae77Db1c982e75a937B9f60FE63690 --network localhost --types '["uint256"]' 42
```

Failed call with handled revert:

```
npx hardhat echo-call --contract 0xE6E340D132b5f46d1e472DebcD681B2aBc16e57E --receiver 0xc3e53F4d16Ae77Db1c982e75a937B9f60FE63690 --network localhost --revert-address 0xE6E340D132b5f46d1e472DebcD681B2aBc16e57E --revert-message 0x --call-on-revert --types '["uint256"]' 42
```

## ZetaChain

Successful call:

```
npx hardhat hell-call --contract 0x67d269191c92Caf3cD7723F116c85e6E9bf55933 --receiver 0xc3e53F4d16Ae77Db1c982e75a937B9f60FE63690 --zrc20 0x2ca7d64A7EFE2D62A725E2B35Cf7230D6677FfEe --function "hello(string)" --network localhost --types '["string"]' hello
```

Failed call:

```
npx hardhat hell-call --contract 0x67d269191c92Caf3cD7723F116c85e6E9bf55933 --receiver 0xc3e53F4d16Ae77Db1c982e75a937B9f60FE63690 --zrc20 0x2ca7d64A7EFE2D62A725E2B35Cf7230D6677FfEe --function "hello(string)" --network localhost --types '["uint256"]' 42
```

Failed call with handled revert:

```
npx hardhat hell-call --contract 0x67d269191c92Caf3cD7723F116c85e6E9bf55933 --receiver 0xc3e53F4d16Ae77Db1c982e75a937B9f60FE63690 --zrc20 0x2ca7d64A7EFE2D62A725E2B35Cf7230D6677FfEe --function "hello(string)" --network localhost --revert-address 0x67d269191c92Caf3cD7723F116c85e6E9bf55933 --revert-message 0x --call-on-revert  --types '["uint256"]' 42
```
