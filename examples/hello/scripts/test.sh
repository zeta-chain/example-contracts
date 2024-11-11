#!/bin/bash

set -e

if [ "$1" = "localnet" ]; then npx hardhat localnet --exit-on-error & sleep 10; fi

echo -e "\n🚀 Compiling contracts..."
npx hardhat compile --force --quiet

ZRC20_ETHEREUM=$(jq -r '.addresses[] | select(.type=="ZRC-20 ETH on 5") | .address' localnet.json)
ZRC20_BNB=$(jq -r '.addresses[] | select(.type=="ZRC-20 BNB on 97") | .address' localnet.json)
GATEWAY_ETHEREUM=$(jq -r '.addresses[] | select(.type=="gatewayEVM" and .chain=="ethereum") | .address' localnet.json)
GATEWAY_ZETACHAIN=$(jq -r '.addresses[] | select(.type=="gatewayZEVM" and .chain=="zetachain") | .address' localnet.json)
SENDER=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

CONTRACT_ZETACHAIN=$(npx hardhat deploy --name Universal --network localhost --gateway "$GATEWAY_ZETACHAIN" --json | jq -r '.contractAddress')
echo -e "\n🚀 Deployed contract on ZetaChain: $CONTRACT_ZETACHAIN"

CONTRACT_ETHEREUM=$(npx hardhat deploy --name Connected --json --network localhost --gateway "$GATEWAY_ETHEREUM" | jq -r '.contractAddress')
echo -e "🚀 Deployed contract on Ethereum: $CONTRACT_ETHEREUM"

npx hardhat connected-call \
  --contract "$CONTRACT_ETHEREUM" \
  --receiver "$CONTRACT_ZETACHAIN" \
  --network localhost \
  --types '["string"]' alice

npx hardhat localnet-check

npx hardhat universal-call \
  --contract "$CONTRACT_ZETACHAIN" \
  --receiver "$CONTRACT_ETHEREUM" \
  --zrc20 "$ZRC20_ETHEREUM" \
  --function "hello(string)" \
  --network localhost \
  --types '["string"]' alice

npx hardhat localnet-check

npx hardhat universal-withdraw-and-call \
  --contract "$CONTRACT_ZETACHAIN" \
  --receiver "$CONTRACT_ETHEREUM" \
  --zrc20 "$ZRC20_ETHEREUM" \
  --function "hello(string)" \
  --amount 1 \
  --network localhost \
  --types '["string"]' hello

npx hardhat localnet-check

if [ "$1" = "localnet" ]; then npx hardhat localnet-stop; fi