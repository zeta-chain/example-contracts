#!/bin/bash

set -e
set -x
set -o pipefail

if [ "$1" = "start" ]; then npx hardhat localnet --exit-on-error & sleep 10; fi

echo -e "\n🚀 Compiling contracts..."
npx hardhat compile --force --quiet

ZRC20_ETHEREUM=$(jq -r '.addresses[] | select(.type=="ZRC-20 ETH on 5") | .address' localnet.json)
ZRC20_USDC=$(jq -r '.addresses[] | select(.type=="ZRC-20 USDC on 97") | .address' localnet.json)
ZRC20_BNB=$(jq -r '.addresses[] | select(.type=="ZRC-20 BNB on 97") | .address' localnet.json)
GATEWAY_ETHEREUM=$(jq -r '.addresses[] | select(.type=="gatewayEVM" and .chain=="ethereum") | .address' localnet.json)
GATEWAY_ZETACHAIN=$(jq -r '.addresses[] | select(.type=="gatewayZEVM" and .chain=="zetachain") | .address' localnet.json)
UNISWAP_ROUTER=$(jq -r '.addresses[] | select(.type=="uniswapRouterInstance" and .chain=="zetachain") | .address' localnet.json)
SENDER=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

CONTRACT_SWAP=$(npx hardhat deploy --name Swap --network localhost --gateway "$GATEWAY_ZETACHAIN" --uniswap-router "$UNISWAP_ROUTER" --json | jq -r '.contractAddress')
echo -e "\n🚀 Deployed Swap contract on ZetaChain: $CONTRACT_SWAP"

npx hardhat swap-from-evm \
  --network localhost \
  --receiver "$CONTRACT_SWAP" \
  --amount 1 \
  --target "$ZRC20_BNB" \
  --recipient "$SENDER"

npx hardhat localnet-check

npx hardhat swap-from-evm \
  --network localhost \
  --receiver "$CONTRACT_SWAP" \
  --amount 1 \
  --target "$ZRC20_BNB" \
  --recipient "$SENDER" \
  --withdraw false

npx hardhat localnet-check

npx hardhat swap-from-zetachain \
  --network localhost \
  --contract "$CONTRACT_SWAP" \
  --amount 1 \
  --zrc20 "$ZRC20_BNB" \
  --target "$ZRC20_ETHEREUM" \
  --recipient "$SENDER"

npx hardhat localnet-check

if [ "$1" = "start" ]; then npx hardhat localnet-stop; fi