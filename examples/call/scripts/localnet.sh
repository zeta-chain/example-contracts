#!/bin/bash

set -e
set -x
set -o pipefail

yarn zetachain localnet start --force-kill --exit-on-error --no-analytics &

while [ ! -f "$HOME/.zetachain/localnet/registry.json" ]; do sleep 1; done

forge build

ZRC20_BNB=$(jq -r '."98".zrc20Tokens[] | select(.coinType == "gas" and .originChainId == "98") | .address' ~/.zetachain/localnet/registry.json) && echo $ZRC20_BNB
ZRC20_ETHEREUM=$(jq -r '."11155112".zrc20Tokens[] | select(.coinType == "gas" and .originChainId == "11155112") | .address' ~/.zetachain/localnet/registry.json) && echo $ZRC20_ETHEREUM
USDC_ETHEREUM=$(jq -r '."11155112".zrc20Tokens[] | select(.symbol == "USDC.ETH") | .address' ~/.zetachain/localnet/registry.json) && echo $USDC_ETHEREUM
GATEWAY_ETHEREUM=$(jq -r '.["11155112"].contracts[] | select(.contractType == "gateway") | .address' ~/.zetachain/localnet/registry.json) && echo $GATEWAY_ETHEREUM
GATEWAY_BNB=$(jq -r '."98".contracts[] | select(.contractType == "gateway") | .address' ~/.zetachain/localnet/registry.json) && echo $GATEWAY_BNB
GATEWAY_ZETACHAIN=$(jq -r '.["31337"].contracts[] | select(.contractType == "gateway") | .address' ~/.zetachain/localnet/registry.json) && echo $GATEWAY_ZETACHAIN
WZETA=$(jq -r '."31337".contracts[] | select(.contractType == "zetaToken") | .address' ~/.zetachain/localnet/registry.json) && echo $WZETA
PRIVATE_KEY=$(jq -r '.private_keys[0]' ~/.zetachain/localnet/anvil.json) && echo $PRIVATE_KEY
RECIPIENT=$(cast wallet address $PRIVATE_KEY) && echo $RECIPIENT
RPC=http://localhost:8545

UNIVERSAL=$(forge create Universal \
  --rpc-url $RPC \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --json \
  --constructor-args $GATEWAY_ZETACHAIN | jq -r .deployedTo) && echo $UNIVERSAL

yarn zetachain localnet check --no-analytics

CONNECTED=$(forge create Connected \
  --rpc-url $RPC \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --json \
  --constructor-args $GATEWAY_ETHEREUM | jq -r .deployedTo) && echo $CONNECTED

yarn zetachain localnet check --no-analytics

npx tsx ./commands connected deposit \
  --rpc $RPC \
  --contract $CONNECTED \
  --private-key $PRIVATE_KEY \
  --receiver $UNIVERSAL \
  --name Connected \
  --amount 0.1

yarn zetachain localnet check --no-analytics

npx tsx ./commands connected call \
  --rpc $RPC \
  --contract $CONNECTED \
  --private-key $PRIVATE_KEY \
  --receiver $UNIVERSAL \
  --types string \
  --values hello \
  --name Connected

yarn zetachain localnet check --no-analytics

npx tsx ./commands connected deposit-and-call \
  --rpc $RPC \
  --contract $CONNECTED \
  --private-key $PRIVATE_KEY \
  --receiver $UNIVERSAL \
  --types string \
  --values hello \
  --amount 0.1 \
  --name Connected

yarn zetachain localnet check --no-analytics

npx tsx ./commands universal withdraw \
  --amount 1 \
  --rpc $RPC \
  --contract $UNIVERSAL \
  --private-key $PRIVATE_KEY \
  --receiver $CONNECTED \
  --name Universal \
  --zrc20 $ZRC20_ETHEREUM 

npx tsx ./commands universal call \
  --rpc $RPC \
  --contract $UNIVERSAL \
  --private-key $PRIVATE_KEY \
  --receiver $CONNECTED \
  --types string \
  --values hello \
  --name Universal \
  --zrc20 $ZRC20_ETHEREUM

yarn zetachain localnet check --no-analytics

npx tsx ./commands universal withdraw-and-call \
  --amount 1 \
  --rpc $RPC \
  --contract $UNIVERSAL \
  --private-key $PRIVATE_KEY \
  --receiver $CONNECTED \
  --types string \
  --values hello \
  --name Universal \
  --zrc20 $ZRC20_ETHEREUM 

yarn zetachain localnet check --no-analytics

yarn zetachain localnet stop --no-analytics