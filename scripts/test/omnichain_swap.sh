#!/bin/bash

set -e

# echo "testing swap"

# source "$(dirname "$0")/../common.sh"

SENDER=0x2cD3D070aE1BD365909dD859d29F387AA96911e1

echo "$(dirname "$0")/../common.sh"

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

popd