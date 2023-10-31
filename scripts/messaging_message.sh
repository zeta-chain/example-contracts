#!/bin/bash

set -e

source "$(dirname "$0")/common.sh"

pushd "./messaging/message"

yarn

npx hardhat compile --force

echo "Testing CCM Message"

CCM_MESSAGE_CONTRACT=$(npx hardhat deploy --networks goerli_testnet,mumbai_testnet --json)
CCM_MESSAGE_TX_OUT=$(npx hardhat interact --network goerli_testnet --contract $(echo $CCM_MESSAGE_CONTRACT | jq -r '.goerli_testnet') --message "Hello World" --destination mumbai_testnet --amount 0.01 --json )
echo $CCM_MESSAGE_TX_OUT
CCM_MESSAGE_TX=$(echo $CCM_MESSAGE_TX_OUT | jq -r '.hash')
echo $CCM_MESSAGE_TX
CCM_MESSAGE_CCTX=$(npx hardhat cctx $CCM_MESSAGE_TX --json)
echo $CCM_MESSAGE_CCTX

popd