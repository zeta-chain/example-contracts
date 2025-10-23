#!/bin/bash

set -exo pipefail

yarn zetachain localnet start --force-kill --exit-on-error --no-analytics &

while [ ! -f "$HOME/.zetachain/localnet/registry.json" ]; do sleep 1; done

forge build

ZRC20_BNB=$(jq -r '."98".zrc20Tokens[] | select(.coinType == "gas" and .originChainId == "98") | .address' ~/.zetachain/localnet/registry.json) && echo $ZRC20_BNB
ZRC20_ETHEREUM=$(jq -r '."11155112".zrc20Tokens[] | select(.coinType == "gas" and .originChainId == "11155112") | .address' ~/.zetachain/localnet/registry.json) && echo $ZRC20_ETHEREUM
USDC_ETHEREUM=$(jq -r '."11155112".zrc20Tokens[] | select(.symbol == "USDC.ETH") | .address' ~/.zetachain/localnet/registry.json) && echo $USDC_ETHEREUM
GATEWAY_ETHEREUM=$(jq -r '.["11155112"].contracts[] | select(.contractType == "gateway") | .address' ~/.zetachain/localnet/registry.json) && echo $GATEWAY_ETHEREUM
GATEWAY_BNB=$(jq -r '."98".contracts[] | select(.contractType == "gateway") | .address' ~/.zetachain/localnet/registry.json) && echo $GATEWAY_BNB
GATEWAY_ZETACHAIN=$(jq -r '.["31337"].contracts[] | select(.contractType == "gateway") | .address' ~/.zetachain/localnet/registry.json) && echo $GATEWAY_ZETACHAIN
UNISWAP_ROUTER=$(jq -r '."31337".contracts[] | select(.contractType == "uniswapV2Router02") | .address' ~/.zetachain/localnet/registry.json) && echo $UNISWAP_ROUTER
WZETA=$(jq -r '."31337".contracts[] | select(.contractType == "zetaToken") | .address' ~/.zetachain/localnet/registry.json) && echo $WZETA
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
  --no-analytics \
  --values $ZRC20_BNB $RECIPIENT true \
  --yes

yarn zetachain localnet check --no-analytics

npx zetachain evm deposit-and-call \
  --rpc http://localhost:8545 \
  --chain-id 11155112 \
  --gateway $GATEWAY_ETHEREUM \
  --amount 0.001 \
  --types address bytes bool \
  --receiver $UNIVERSAL \
  --no-analytics \
  --private-key $PRIVATE_KEY \
  --values $WZETA $RECIPIENT false \
  --yes

yarn zetachain localnet check --no-analytics

yarn zetachain localnet stop --no-analytics