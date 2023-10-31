#!/bin/bash

set -e

source "$(dirname "$0")/../common.sh"

pushd "./messaging/counter"

yarn

npx hardhat compile --force

echo "Testing CCM Counter"

CCM_COUNTER_CONTRACT=$(npx hardhat deploy --networks goerli_testnet,mumbai_testnet --json | jq -r '.goerli_testnet')
echo $CCM_COUNTER_CONTRACT
CCM_COUNTER_TX_OUT=$(npx hardhat interact --network goerli_testnet --contract $CCM_COUNTER_CONTRACT --destination mumbai_testnet --amount 0.01 --json)
echo $CCM_COUNTER_TX_OUT
CCM_COUNTER_TX=$(echo $CCM_COUNTER_TX_OUT | jq -r '.hash')
echo $CCM_COUNTER_TX
CCM_COUNTER_CCTX=$(npx hardhat cctx $CCM_COUNTER_TX --json)
echo $CCM_COUNTER_CCTX

popd