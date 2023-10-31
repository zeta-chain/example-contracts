#!/bin/bash

set -e

source "$(dirname "$0")/../common.sh"

cd ./omnichain/swap

yarn

npx hardhat compile --force

echo "Testing omnichain Swap"

OMNI_SWAP_CONTRACT=$(npx hardhat deploy --network zeta_testnet --json | jq -r '.address')
# echo "omnichain.swap.zeta_testnet=$OMNI_SWAP_CONTRACT" >> contracts.toml
OMNI_SWAP_TX=$(npx hardhat interact --contract $OMNI_SWAP_CONTRACT --network goerli_testnet --amount 0.01 --recipient $SENDER --destination mumbai_testnet --json | jq -r '.hash')
echo $OMNI_SWAP_TX
OMNI_SWAP_CCTX=$(npx hardhat cctx $OMNI_SWAP_TX --json)
echo $OMNI_SWAP_CCTX