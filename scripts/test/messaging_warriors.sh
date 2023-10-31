#!/bin/bash

set -e

source "$(dirname "$0")/../common.sh"

pushd "./messaging/warriors"

yarn

npx hardhat compile --force

echo "Testing CCM Warriors"

CCM_NFT_CONTRACT=$(npx hardhat deploy --networks goerli_testnet,mumbai_testnet --json | jq -r '.goerli_testnet')
echo $CCM_NFT_CONTRACT

CCM_NFT_MINT=$(npx hardhat mint --network goerli_testnet --contract $CCM_NFT_CONTRACT --json)
CCM_NFT_TX_OUT=$(npx hardhat interact --network goerli_testnet --contract $CCM_NFT_CONTRACT --token $CCM_NFT_MINT --destination mumbai_testnet --amount 0.01 --to $SENDER --json)
echo $CCM_NFT_TX_OUT
CCM_NFT_TX=$(echo $CCM_NFT_TX_OUT | jq -r '.hash')
echo $CCM_NFT_TX
CCM_NFT_CCTX=$(npx hardhat cctx $CCM_NFT_TX --json)
echo $CCM_NFT_CCTX

popd