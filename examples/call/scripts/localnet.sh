#!/bin/bash

set -e
set -x
set -o pipefail

if [ "$1" = "start" ]; then npx hardhat localnet & sleep 20; fi

echo -e "\n🚀 Compiling contracts..."
npx hardhat compile --force --quiet

ZRC20_ETHEREUM=$(jq -r '.addresses[] | select(.type=="ZRC-20 ETH on 5") | .address' localnet.json)
ERC20_ETHEREUM=$(jq -r '.addresses[] | select(.type=="ERC-20 USDC" and .chain=="ethereum") | .address' localnet.json)
ZRC20_BNB=$(jq -r '.addresses[] | select(.type=="ZRC-20 BNB on 97") | .address' localnet.json)
ZRC20_SOL=$(jq -r '.addresses[] | select(.type=="ZRC-20 SOL on 901") | .address' localnet.json)
ZRC20_SPL=$(jq -r '.addresses[] | select(.type=="ZRC-20 USDC on 901") | .address' localnet.json)
USDC_SPL=$(jq -r '.addresses[] | select(.type=="SPL-20 USDC") | .address' localnet.json)
GATEWAY_ETHEREUM=$(jq -r '.addresses[] | select(.type=="gatewayEVM" and .chain=="ethereum") | .address' localnet.json)
GATEWAY_ZETACHAIN=$(jq -r '.addresses[] | select(.type=="gatewayZEVM" and .chain=="zetachain") | .address' localnet.json)
SENDER=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

CONTRACT_ZETACHAIN=$(npx hardhat deploy --name Universal --network localhost --gateway "$GATEWAY_ZETACHAIN" --json | jq -r '.contractAddress')
echo -e "\n🚀 Deployed contract on ZetaChain: $CONTRACT_ZETACHAIN"

CONTRACT_ETHEREUM=$(npx hardhat deploy --name Connected --json --network localhost --gateway "$GATEWAY_ETHEREUM" | jq -r '.contractAddress')
echo -e "🚀 Deployed contract on Ethereum: $CONTRACT_ETHEREUM"

CONTRACT_SOL=9BjVGjn28E58LgSi547JYEpqpgRoo1TErkbyXiRSNDQy
cd solana && anchor build && npx ts-node setup/main.ts "$USDC_SPL" && cd -

npx hardhat connected-deposit \
  --contract "$CONTRACT_ETHEREUM" \
  --receiver "$CONTRACT_ZETACHAIN" \
  --network localhost \
  --abort-address "$CONTRACT_ZETACHAIN" \
  --amount 1

npx hardhat localnet-check

npx hardhat connected-deposit \
  --contract "$CONTRACT_ETHEREUM" \
  --receiver "$CONTRACT_ZETACHAIN" \
  --network localhost \
  --erc20 "$ERC20_ETHEREUM" \
  --abort-address "$CONTRACT_ZETACHAIN" \
  --amount 1

npx hardhat localnet-check

npx hardhat connected-call \
  --contract "$CONTRACT_ETHEREUM" \
  --receiver "$CONTRACT_ZETACHAIN" \
  --network localhost \
  --abort-address "$CONTRACT_ZETACHAIN" \
  --types '["string"]' alice

npx hardhat localnet-check

npx hardhat connected-deposit-and-call \
  --contract "$CONTRACT_ETHEREUM" \
  --receiver "$CONTRACT_ZETACHAIN" \
  --network localhost \
  --amount 1 \
  --abort-address "$CONTRACT_ZETACHAIN" \
  --types '["string"]' alice

npx hardhat localnet-check

npx hardhat connected-deposit-and-call \
  --contract "$CONTRACT_ETHEREUM" \
  --receiver "$CONTRACT_ZETACHAIN" \
  --network localhost \
  --amount 1 \
  --erc20 "$ERC20_ETHEREUM" \
  --abort-address "$CONTRACT_ZETACHAIN" \
  --types '["string"]' alice

npx hardhat localnet-check

npx hardhat universal-withdraw \
  --contract "$CONTRACT_ZETACHAIN" \
  --receiver "$CONTRACT_ETHEREUM" \
  --zrc20 "$ZRC20_ETHEREUM" \
  --network localhost \
  --abort-address "$CONTRACT_ZETACHAIN" \
  --amount 1

npx hardhat localnet-check

npx hardhat universal-call \
  --contract "$CONTRACT_ZETACHAIN" \
  --receiver "$CONTRACT_ETHEREUM" \
  --zrc20 "$ZRC20_ETHEREUM" \
  --function "hello(string)" \
  --network localhost \
  --abort-address "$CONTRACT_ZETACHAIN" \
  --types '["string"]' alice

npx hardhat localnet-check

npx hardhat universal-withdraw-and-call \
  --contract "$CONTRACT_ZETACHAIN" \
  --receiver "$CONTRACT_ETHEREUM" \
  --zrc20 "$ZRC20_ETHEREUM" \
  --function "hello(string)" \
  --amount 1 \
  --network localhost \
  --call-options-is-arbitrary-call \
  --abort-address "$CONTRACT_ZETACHAIN" \
  --types '["string"]' hello

npx hardhat localnet-check

npx hardhat universal-withdraw-and-call \
  --contract "$CONTRACT_ZETACHAIN" \
  --receiver "$CONTRACT_ETHEREUM" \
  --zrc20 "$ZRC20_ETHEREUM" \
  --amount 1 \
  --network localhost \
  --abort-address "$CONTRACT_ZETACHAIN" \
  --types '["string"]' hello

npx hardhat localnet-check

# Testing toolkit methods

npx hardhat evm-deposit \
  --receiver "$CONTRACT_ZETACHAIN" \
  --gateway-evm "$GATEWAY_ETHEREUM" \
  --network localhost \
  --amount 1

npx hardhat localnet-check

npx hardhat evm-deposit \
  --receiver "$CONTRACT_ZETACHAIN" \
  --gateway-evm "$GATEWAY_ETHEREUM" \
  --network localhost \
  --erc20 "$ERC20_ETHEREUM" \
  --amount 1

npx hardhat localnet-check

npx hardhat evm-call \
  --receiver "$CONTRACT_ZETACHAIN" \
  --gateway-evm "$GATEWAY_ETHEREUM" \
  --network localhost \
  --types '["string"]' alice

npx hardhat localnet-check

npx hardhat evm-deposit-and-call \
  --receiver "$CONTRACT_ZETACHAIN" \
  --gateway-evm "$GATEWAY_ETHEREUM" \
  --network localhost \
  --amount 1 \
  --types '["string"]' alice

npx hardhat localnet-check

npx hardhat evm-deposit-and-call \
  --receiver "$CONTRACT_ZETACHAIN" \
  --gateway-evm "$GATEWAY_ETHEREUM" \
  --network localhost \
  --amount 1 \
  --erc20 "$ERC20_ETHEREUM" \
  --types '["string"]' alice

npx hardhat localnet-check

npx hardhat zetachain-withdraw \
  --receiver "$CONTRACT_ETHEREUM" \
  --gateway-zeta-chain "$GATEWAY_ZETACHAIN" \
  --zrc20 "$ZRC20_ETHEREUM" \
  --network localhost \
  --amount 1

npx hardhat localnet-check

npx hardhat zetachain-withdraw \
  --receiver "DrexsvCMH9WWjgnjVbx1iFf3YZcKadupFmxnZLfSyotd" \
  --gateway-zeta-chain "$GATEWAY_ZETACHAIN" \
  --zrc20 "$ZRC20_SOL" \
  --network localhost \
  --amount 1

npx hardhat localnet-check

npx hardhat zetachain-call \
  --receiver "$CONTRACT_ETHEREUM" \
  --gateway-zeta-chain "$GATEWAY_ZETACHAIN" \
  --zrc20 "$ZRC20_ETHEREUM" \
  --function "hello(string)" \
  --network localhost \
  --types '["string"]' alice

npx hardhat localnet-check

npx hardhat zetachain-withdraw-and-call \
  --receiver "$CONTRACT_ETHEREUM" \
  --gateway-zeta-chain "$GATEWAY_ZETACHAIN" \
  --zrc20 "$ZRC20_ETHEREUM" \
  --function "hello(string)" \
  --amount 1 \
  --network localhost \
  --call-options-is-arbitrary-call \
  --types '["string"]' hello

npx hardhat localnet-check

ENCODED_ACCOUNTS_AND_DATA=$(npx ts-node solana/setup/encodeCallArgs.ts "sol" "$USDC_SPL")
npx hardhat zetachain-withdraw-and-call \
  --receiver "$CONTRACT_SOL" \
  --gateway-zeta-chain "$GATEWAY_ZETACHAIN" \
  --zrc20 "$ZRC20_SOL" \
  --amount 1 \
  --network localhost \
  --types '["bytes"]' $ENCODED_ACCOUNTS_AND_DATA

npx hardhat localnet-check

ENCODED_ACCOUNTS_AND_DATA=$(npx ts-node solana/setup/encodeCallArgs.ts "spl" "$USDC_SPL")
npx hardhat zetachain-withdraw-and-call \
  --receiver "$CONTRACT_SOL" \
  --gateway-zeta-chain "$GATEWAY_ZETACHAIN" \
  --zrc20 "$ZRC20_SPL" \
  --amount 1 \
  --network localhost \
  --types '["bytes"]' $ENCODED_ACCOUNTS_AND_DATA

npx hardhat localnet-check

npx hardhat zetachain-withdraw-and-call \
  --receiver "$CONTRACT_ETHEREUM" \
  --gateway-zeta-chain "$GATEWAY_ZETACHAIN" \
  --zrc20 "$ZRC20_ETHEREUM" \
  --amount 1 \
  --network localhost \
  --types '["string"]' hello

npx hardhat localnet-check

if [ "$1" = "start" ]; then npx hardhat localnet-stop; fi