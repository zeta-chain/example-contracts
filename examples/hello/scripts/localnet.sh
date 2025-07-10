#!/bin/bash

set -e
set -x
set -o pipefail

yarn zetachain localnet start --force-kill --exit-on-error &

while [ ! -f "localnet.json" ]; do sleep 1; done

npx hardhat compile --force --quiet

GATEWAY_ZETACHAIN=$(jq -r '.addresses[] | select(.type=="gateway" and .chain=="zetachain") | .address' localnet.json)
GATEWAY_ETHEREUM=$(jq -r '.addresses[] | select(.type=="gateway" and .chain=="ethereum") | .address' localnet.json)

CONTRACT_ZETACHAIN=$(npx hardhat deploy --name Universal --network localhost --gateway "$GATEWAY_ZETACHAIN" --json | jq -r '.contractAddress')
echo -e "\n🚀 Deployed contract on ZetaChain: $CONTRACT_ZETACHAIN"

PRIVATE_KEY=$(jq -r '.private_keys[0]' ~/.zetachain/localnet/anvil.json)

yarn zetachain evm call \
  --gateway "$GATEWAY_ETHEREUM" \
  --receiver "$CONTRACT_ZETACHAIN" \
  --rpc http://localhost:8545 \
  --types string \
  --values alice \
  --yes \
  --private-key "$PRIVATE_KEY"

yarn zetachain localnet check

yarn zetachain localnet stop