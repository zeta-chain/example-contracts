#!/bin/bash

set -exo pipefail

yarn zetachain localnet start --force-kill --no-analytics &

REGISTRY_FILE="$HOME/.zetachain/localnet/registry.json"
while [ ! -f "$REGISTRY_FILE" ]; do sleep 1; done

forge soldeer update

forge build

ZRC20_ETHEREUM=$(jq -r '."11155112".zrc20Tokens[] | select(.symbol=="ETH.ETH") | .address' "$REGISTRY_FILE")
USDC_ETHEREUM=$(jq -r '."11155112".zrc20Tokens[] | select(.symbol=="USDC.ETH") | .originAddress' "$REGISTRY_FILE")
ZRC20_USDC_BNB=$(jq -r '."98".zrc20Tokens[] | select(.symbol=="USDC.BNB") | .address' "$REGISTRY_FILE")
ZRC20_BNB=$(jq -r '."98".zrc20Tokens[] | select(.symbol=="BNB.BNB") | .address' "$REGISTRY_FILE")
GATEWAY_ETHEREUM=$(jq -r '."11155112".contracts[] | select(.contractType=="gateway") | .address' "$REGISTRY_FILE")
GATEWAY_ZETACHAIN=$(jq -r '."31337".contracts[] | select(.contractType=="gateway") | .address' "$REGISTRY_FILE")
GATEWAY_BNB=$(jq -r '."98".contracts[] | select(.contractType=="gateway") | .address' "$REGISTRY_FILE")
PRIVATE_KEY=$(jq -r '.private_keys[0]' ~/.zetachain/localnet/anvil.json) && echo $PRIVATE_KEY
DEPLOYER_ADDRESS=$(cast wallet address $PRIVATE_KEY)

CONTRACT_ZETACHAIN=$(forge create --broadcast --json test/UniversalRouter.sol:UniversalRouter --rpc-url http://localhost:8545 --private-key $PRIVATE_KEY --constructor-args $DEPLOYER_ADDRESS | jq -r '.deployedTo')

CONTRACT_ETHEREUM=$(npx tsx commands deploy --rpc http://localhost:8545 --gateway "$GATEWAY_ETHEREUM" --router "$CONTRACT_ZETACHAIN" --private-key $PRIVATE_KEY | jq -r '.contractAddress')

CONTRACT_BNB=$(npx tsx commands deploy --rpc http://localhost:8545 --gateway "$GATEWAY_BNB" --router "$CONTRACT_ZETACHAIN" --private-key $PRIVATE_KEY | jq -r '.contractAddress')

npx tsx commands connect --rpc http://localhost:8545 --private-key $PRIVATE_KEY --contract "$CONTRACT_ETHEREUM" --target-chain-id 98 --target-contract "$CONTRACT_BNB"
npx tsx commands connect --rpc http://localhost:8545 --private-key $PRIVATE_KEY --contract "$CONTRACT_BNB"  --target-chain-id 11155112 --target-contract "$CONTRACT_ETHEREUM"

# Gas
npx tsx commands message --rpc http://localhost:8545 --private-key $PRIVATE_KEY --contract "$CONTRACT_ETHEREUM" --target-contract "$CONTRACT_BNB" --amount 1 --call-on-revert --revert-address "$CONTRACT_ETHEREUM" --revert-message "hello" --types string --values alice --target-token "$ZRC20_BNB"

npx zetachain localnet check

# Source ERC-20
npx tsx commands message --rpc http://localhost:8545 --private-key $PRIVATE_KEY --contract "$CONTRACT_ETHEREUM" --target-contract "$CONTRACT_BNB" --amount 1 --call-on-revert --revert-address "$CONTRACT_ETHEREUM" --revert-message "hello" --types string --values alice --erc20 "$USDC_ETHEREUM" --target-token "$ZRC20_BNB"

npx zetachain localnet check

yarn zetachain localnet stop