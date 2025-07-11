#!/bin/bash

set -e
set -x
set -o pipefail

yarn zetachain localnet start --force-kill --exit-on-error --verbosity debug &

while [ ! -f "localnet.json" ]; do sleep 1; done

npx hardhat compile --force --quiet

ZRC20_ETHEREUM=$(jq -r '.addresses[] | select(.type=="ZRC-20 ETH on 11155112") | .address' localnet.json)
USDC_ETHEREUM=$(jq -r '.addresses[] | select(.type=="ERC-20 USDC" and .chain=="ethereum") | .address' localnet.json)
ZRC20_USDC=$(jq -r '.addresses[] | select(.type=="ZRC-20 USDC on 98") | .address' localnet.json)
ZRC20_BNB=$(jq -r '.addresses[] | select(.type=="ZRC-20 BNB on 98") | .address' localnet.json)
WZETA=$(jq -r '.addresses[] | select(.type=="wzeta" and .chain=="zetachain") | .address' localnet.json)
GATEWAY_ETHEREUM=$(jq -r '.addresses[] | select(.type=="gateway" and .chain=="ethereum") | .address' localnet.json)
GATEWAY_ZETACHAIN=$(jq -r '.addresses[] | select(.type=="gateway" and .chain=="zetachain") | .address' localnet.json)
UNISWAP_ROUTER=$(jq -r '.addresses[] | select(.type=="uniswapRouterInstance" and .chain=="zetachain") | .address' localnet.json)
SENDER=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

CONTRACT_SWAP=$(npx hardhat deploy --name Swap --network localhost --gateway "$GATEWAY_ZETACHAIN" --uniswap-router "$UNISWAP_ROUTER" | jq -r '.contractAddress')
COMPANION=$(npx hardhat deploy-companion --gateway "$GATEWAY_ETHEREUM" --network localhost --json | jq -r '.contractAddress')

npx hardhat evm-swap \
  --network localhost \
  --receiver "$CONTRACT_SWAP" \
  --amount 0.1 \
  --target "$WZETA" \
  --gateway-evm "$GATEWAY_ETHEREUM" \
  --skip-checks \
  --withdraw false \
  --recipient "$SENDER"

yarn zetachain localnet check

npx hardhat evm-swap \
  --network localhost \
  --receiver "$CONTRACT_SWAP" \
  --amount 0.1 \
  --gateway-evm "$GATEWAY_ETHEREUM" \
  --target "$ZRC20_USDC" \
  --skip-checks \
  --recipient "$SENDER"

yarn zetachain localnet check

npx hardhat evm-swap \
  --network localhost \
  --receiver "$CONTRACT_SWAP" \
  --amount 0.1 \
  --target "$ZRC20_BNB" \
  --gateway-evm "$GATEWAY_ETHEREUM" \
  --skip-checks \
  --erc20 "$USDC_ETHEREUM" \
  --recipient "$SENDER"

yarn zetachain localnet check

npx hardhat evm-swap \
  --skip-checks \
  --network localhost \
  --receiver "$CONTRACT_SWAP" \
  --amount 0.1 \
  --gateway-evm "$GATEWAY_ETHEREUM" \
  --target "$ZRC20_BNB" \
  --recipient "$SENDER"

yarn zetachain localnet check

npx hardhat evm-swap \
  --skip-checks \
  --network localhost \
  --receiver "$CONTRACT_SWAP" \
  --amount 0.1 \
  --target "$ZRC20_BNB" \
  --gateway-evm "$GATEWAY_ETHEREUM" \
  --recipient "$SENDER" \
  --withdraw false

yarn zetachain localnet check

npx hardhat companion-swap \
  --network localhost \
  --skip-checks \
  --contract "$COMPANION" \
  --universal-contract "$CONTRACT_SWAP" \
  --amount 0.1 \
  --target "$ZRC20_BNB" \
  --recipient "$SENDER" 

yarn zetachain localnet check

npx hardhat companion-swap \
  --skip-checks \
  --network localhost \
  --contract "$COMPANION" \
  --universal-contract "$CONTRACT_SWAP" \
  --amount 0.1 \
  --erc20 "$USDC_ETHEREUM" \
  --target "$ZRC20_BNB" \
  --recipient "$SENDER"

yarn zetachain localnet check

npx hardhat zetachain-swap \
  --network localhost \
  --contract "$CONTRACT_SWAP" \
  --amount 0.1 \
  --zrc20 "$ZRC20_BNB" \
  --target "$ZRC20_ETHEREUM" \
  --recipient "$SENDER"

yarn zetachain localnet check

yarn zetachain localnet stop