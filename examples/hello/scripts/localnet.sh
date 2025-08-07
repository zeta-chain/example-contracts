#!/bin/bash

set -e
set -x
set -o pipefail

yarn zetachain localnet start --force-kill --exit-on-error &

while [ ! -f "$HOME/.zetachain/localnet/registry.json" ]; do sleep 1; done

forge build

GATEWAY_ETHEREUM=$(jq -r '.["11155112"].contracts[] | select(.contractType == "gateway") | .address' ~/.zetachain/localnet/registry.json) && echo $GATEWAY_ETHEREUM
GATEWAY_ZETACHAIN=$(jq -r '.["31337"].contracts[] | select(.contractType == "gateway") | .address' ~/.zetachain/localnet/registry.json) && echo $GATEWAY_ZETACHAIN
PRIVATE_KEY=$(jq -r '.private_keys[0]' ~/.zetachain/localnet/anvil.json) && echo $PRIVATE_KEY

UNIVERSAL=$(forge create Universal \
  --rpc-url http://localhost:8545 \
  --private-key $PRIVATE_KEY \
  --evm-version paris \
  --broadcast \
  --json \
  --constructor-args $GATEWAY_ZETACHAIN | jq -r .deployedTo) && echo $UNIVERSAL

yarn zetachain evm call \
  --gateway "$GATEWAY_ETHEREUM" \
  --receiver "$UNIVERSAL" \
  --rpc http://localhost:8545 \
  --types string \
  --values alice \
  --yes \
  --private-key "$PRIVATE_KEY"

yarn zetachain localnet check

yarn zetachain localnet stop