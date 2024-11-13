#!/bin/bash

set -e
set -x

if [ "$1" = "localnet" ]; then npx hardhat localnet --exit-on-error & sleep 10; fi

echo -e "\n🚀 Compiling contracts..."
npx hardhat compile --force --quiet

GATEWAY_ETHEREUM=$(jq -r '.addresses[] | select(.type=="gatewayEVM" and .chain=="ethereum") | .address' localnet.json)
GATEWAY_ZETACHAIN=$(jq -r '.addresses[] | select(.type=="gatewayZEVM" and .chain=="zetachain") | .address' localnet.json)

CONTRACT_ZETACHAIN=$(npx hardhat deploy --name Universal --network localhost --gateway "$GATEWAY_ZETACHAIN" --json | jq -r '.contractAddress')
echo -e "\n🚀 Deployed contract on ZetaChain: $CONTRACT_ZETACHAIN"

npx hardhat evm-call \
  --gateway-evm "$GATEWAY_ETHEREUM" \
  --receiver "$CONTRACT_ZETACHAIN" \
  --network localhost \
  --types '["string"]' alice

npx hardhat localnet-check

if [ "$1" = "localnet" ]; then npx hardhat localnet-stop; fi