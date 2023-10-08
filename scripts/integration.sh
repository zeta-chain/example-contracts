#!/bin/bash

set -e

pushd "./omnichain/swap"

yarn

npx hardhat compile --force

echo "Testing omnichain Swap"

OMNICHAIN_SWAP_CONTRACT=$(npx hardhat deploy --network zeta_testnet --json | jq -r '.address')

echo $OMNICHAIN_SWAP_CONTRACT

OMNICHAIN_SWAP_TX_SHOULD_SUCCEED=$(npx hardhat interact --contract $OMNICHAIN_SWAP_CONTRACT --network goerli_testnet --amount 0.01 --recipient 0x2cD3D070aE1BD365909dD859d29F387AA96911e1 --destination mumbai_testnet --json | jq -r '.hash')

echo $OMNICHAIN_SWAP_TX_SHOULD_SUCCEED

OMNICHAIN_SWAP_CCTX_SHOULD_SUCCEED=$(npx hardhat cctx $OMNICHAIN_SWAP_TX_SHOULD_SUCCEED --json)

echo $OMNICHAIN_SWAP_CCTX_SHOULD_SUCCEED

popd