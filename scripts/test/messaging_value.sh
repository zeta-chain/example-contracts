#!/bin/bash

set -e

source "$(dirname "$0")/../common.sh"

pushd "./messaging/value"

yarn

npx hardhat compile --force

echo "Testing CCM Value"

CCM_VALUE_CONTRACT=$(npx hardhat deploy --networks goerli_testnet,mumbai_testnet --json | jq -r '.goerli_testnet')
echo $CCM_VALUE_CONTRACT
PROTOCOL_FEE=$(npx hardhat fees --json | jq -r ".feesCCM.mumbai_testnet.protocolFee")
GAS_FEE=$(npx hardhat fees --json | jq -r ".feesCCM.mumbai_testnet.gasFee")
# Multiply to be on the safe side
CCM_FEE=$(echo "$PROTOCOL_FEE + $GAS_FEE * 3" | bc -l)
CCM_VALUE_TX_OUT=$(npx hardhat interact --network goerli_testnet --contract $CCM_VALUE_CONTRACT --destination mumbai_testnet --amount $CCM_FEE --json)
echo $CCM_VALUE_TX_OUT
CCM_VALUE_TX=$(echo $CCM_VALUE_TX_OUT | jq -r '.hash')
echo $CCM_VALUE_TX
CCM_VALUE_CCTX=$(npx hardhat cctx $CCM_VALUE_TX --json)
echo $CCM_VALUE_CCTX

popd