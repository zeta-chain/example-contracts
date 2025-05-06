#!/bin/bash

set -e
set -x
set -o pipefail

yarn zetachain localnet start --skip sui ton solana --exit-on-error &

while [ ! -f "localnet.json" ]; do sleep 1; done

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

yarn zetachain localnet check

yarn zetachain localnet stop