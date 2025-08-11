#!/bin/bash

set -e
set -x
set -o pipefail

yarn zetachain localnet start --force-kill --exit-on-error &

while [ ! -f "$HOME/.zetachain/localnet/registry.json" ]; do sleep 1; done

forge build

ZRC20_BNB=$(jq -r '."98".chainInfo.gasZRC20' ~/.zetachain/localnet/registry.json) && echo $ZRC20_BNB
ZRC20_ETHEREUM=$(jq -r '."11155112".chainInfo.gasZRC20' ~/.zetachain/localnet/registry.json) && echo $ZRC20_ETHEREUM
USDC_ETHEREUM=$(jq -r '.["11155112"].contracts[] | select(.contractType == "ERC-20 USDC") | .address' ~/.zetachain/localnet/registry.json) && echo $USDC_ETHEREUM
GATEWAY_ETHEREUM=$(jq -r '.["11155112"].contracts[] | select(.contractType == "gateway") | .address' ~/.zetachain/localnet/registry.json) && echo $GATEWAY_ETHEREUM
GATEWAY_BNB=$(jq -r '."98".contracts[] | select(.contractType == "gateway") | .address' ~/.zetachain/localnet/registry.json) && echo $GATEWAY_BNB
GATEWAY_ZETACHAIN=$(jq -r '.["31337"].contracts[] | select(.contractType == "gateway") | .address' ~/.zetachain/localnet/registry.json) && echo $GATEWAY_ZETACHAIN
UNISWAP_ROUTER=$(jq -r '.["31337"].contracts[] | select(.contractType == "uniswapRouterInstance") | .address' ~/.zetachain/localnet/registry.json) && echo $UNISWAP_ROUTER
WZETA=$(jq -r '.["31337"].contracts[] | select(.contractType == "wzeta") | .address' ~/.zetachain/localnet/registry.json) && echo $WZETA
PRIVATE_KEY=$(jq -r '.private_keys[0]' ~/.zetachain/localnet/anvil.json) && echo $PRIVATE_KEY
RECIPIENT=$(cast wallet address $PRIVATE_KEY) && echo $RECIPIENT
RPC=http://localhost:8545

UNIVERSAL=$(npx ts-node commands/index.ts deploy \
  --private-key $PRIVATE_KEY \
  --gateway $GATEWAY_ZETACHAIN \
  --rpc $RPC \
  --uniswap-router $UNISWAP_ROUTER | jq -r .contractAddress)

npx zetachain evm deposit-and-call \
  --rpc http://localhost:8545 \
  --chain-id 11155112 \
  --gateway $GATEWAY_ETHEREUM \
  --amount 0.001 \
  --types address bytes bool \
  --receiver $UNIVERSAL \
  --private-key $PRIVATE_KEY \
  --values $ZRC20_BNB $RECIPIENT true \
  --yes

yarn zetachain localnet check

npx zetachain evm deposit-and-call \
  --rpc http://localhost:8545 \
  --chain-id 11155112 \
  --gateway $GATEWAY_ETHEREUM \
  --amount 0.001 \
  --types address bytes bool \
  --receiver $UNIVERSAL \
  --private-key $PRIVATE_KEY \
  --values $WZETA $RECIPIENT false \
  --yes

yarn zetachain localnet check

yarn zetachain localnet stop