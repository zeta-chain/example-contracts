#!/bin/bash

set -e

source "$(dirname "$0")/../common.sh"

pushd "./omnichain/multioutput"

yarn

npx hardhat compile --force

echo "Testing omnichain Multioutput"

OMNI_MULTIOUTPUT_CONTRACT=$(npx hardhat deploy --network zeta_testnet --json | jq -r '.address')
echo $OMNI_MULTIOUTPUT_CONTRACT

npx hardhat destination --contract $OMNI_MULTIOUTPUT_CONTRACT --network zeta_testnet --destination mumbai_testnet
OMNI_MULTIOUTPUT_TX=$(npx hardhat interact --contract $OMNI_MULTIOUTPUT_CONTRACT --network goerli_testnet --amount 0.01 --recipient $SENDER --json | jq -r '.hash')
echo $OMNI_MULTIOUTPUT_TX
OMNI_MULTIOUTPUT_CCTX=$(npx hardhat cctx $OMNI_MULTIOUTPUT_TX --json)
echo $OMNI_MULTIOUTPUT_CCTX

popd