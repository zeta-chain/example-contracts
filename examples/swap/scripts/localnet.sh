#!/bin/bash

set -e
set -x
set -o pipefail

if [ "$1" = "start" ]; then npx hardhat localnet --exit-on-error & sleep 10; fi

echo -e "\n🚀 Compiling contracts..."
npx hardhat compile --force --quiet

ZRC20_ETHEREUM=$(jq -r '.addresses[] | select(.type=="ZRC-20 ETH on 5") | .address' localnet.json)
USDC_ETHEREUM=$(jq -r '.addresses[] | select(.type=="ERC-20" and .chain=="ethereum") | .address' localnet.json)
ZRC20_USDC=$(jq -r '.addresses[] | select(.type=="ZRC-20 USDC on 97") | .address' localnet.json)
ZRC20_BNB=$(jq -r '.addresses[] | select(.type=="ZRC-20 BNB on 97") | .address' localnet.json)
GATEWAY_ETHEREUM=$(jq -r '.addresses[] | select(.type=="gatewayEVM" and .chain=="ethereum") | .address' localnet.json)
GATEWAY_ZETACHAIN=$(jq -r '.addresses[] | select(.type=="gatewayZEVM" and .chain=="zetachain") | .address' localnet.json)
UNISWAP_ROUTER=$(jq -r '.addresses[] | select(.type=="uniswapRouterInstance" and .chain=="zetachain") | .address' localnet.json)
SENDER=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

CONTRACT_SWAP=$(npx hardhat deploy --name Swap --network localhost --gateway "$GATEWAY_ZETACHAIN" --uniswap-router "$UNISWAP_ROUTER" | jq -r '.contractAddress')
COMPANION=$(npx hardhat deploy-companion --gateway "$GATEWAY_ETHEREUM" --network localhost --json | jq -r '.contractAddress')

npx hardhat companion-swap \
  --skip-checks \
  --network localhost \
  --contract "$COMPANION" \
  --universal-contract "$CONTRACT_SWAP" \
  --amount 1 \
  --target "$ZRC20_BNB" \
  --recipient "$SENDER" 

npx hardhat localnet-check

npx hardhat companion-swap \
  --skip-checks \
  --network localhost \
  --contract "$COMPANION" \
  --universal-contract "$CONTRACT_SWAP" \
  --amount 1 \
  --erc20 "$USDC_ETHEREUM" \
  --target "$ZRC20_BNB" \
  --recipient "$SENDER"

npx hardhat localnet-check

npx hardhat evm-swap \
  --skip-checks \
  --network localhost \
  --receiver "$CONTRACT_SWAP" \
  --amount 1 \
  --target "$ZRC20_BNB" \
  --recipient "$SENDER"

npx hardhat localnet-check

npx hardhat evm-swap \
  --skip-checks \
  --network localhost \
  --receiver "$CONTRACT_SWAP" \
  --amount 1 \
  --target "$ZRC20_BNB" \
  --recipient "$SENDER" \
  --withdraw false

npx hardhat localnet-check

npx hardhat zetachain-swap \
  --network localhost \
  --contract "$CONTRACT_SWAP" \
  --amount 1 \
  --zrc20 "$ZRC20_BNB" \
  --target "$ZRC20_ETHEREUM" \
  --recipient "$SENDER"

npx hardhat localnet-check

if [ "$1" = "start" ]; then npx hardhat localnet-stop; fi