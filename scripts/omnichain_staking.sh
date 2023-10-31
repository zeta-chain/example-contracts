#!/bin/bash

set -e

source "$(dirname "$0")/common.sh"

pushd "./omnichain/staking"

yarn

npx hardhat compile --force

echo "Testing omnichain Staking"

OMNI_STAKING_CONTRACT=$(npx hardhat deploy --network zeta_testnet --chain goerli_testnet --json | jq -r '.address')

echo $OMNI_STAKING_CONTRACT

echo "Setting beneficiary"
OMNI_STAKING_BENEFICIARY_TX=$(npx hardhat set-beneficiary $SENDER --contract $OMNI_STAKING_CONTRACT --network goerli_testnet --json | jq -r '.hash')
echo $OMNI_STAKING_BENEFICIARY_TX
OMNI_STAKING_BENEFICIARY_CCTX=$(npx hardhat cctx $OMNI_STAKING_BENEFICIARY_TX --json)
echo $OMNI_STAKING_BENEFICIARY_CCTX

echo "Setting withdraw"
OMNI_STAKING_WITHDRAW_TX=$(npx hardhat set-withdraw --contract $OMNI_STAKING_CONTRACT --network goerli_testnet --json | jq -r '.hash')
echo $OMNI_STAKING_WITHDRAW_TX
OMNI_STAKING_WITHDRAW_CCTX=$(npx hardhat cctx $OMNI_STAKING_WITHDRAW_TX --json)
echo $OMNI_STAKING_WITHDRAW_CCTX

echo "Stake"
OMNI_STAKING_STAKE_TX=$(npx hardhat stake --amount 0.01 --contract $OMNI_STAKING_CONTRACT --network goerli_testnet --json | jq -r '.hash')
echo $OMNI_STAKING_STAKE_TX
OMNI_STAKING_STAKE_CCTX=$(npx hardhat cctx $OMNI_STAKING_STAKE_TX --json)
echo $OMNI_STAKING_STAKE_CCTX

echo "Unstake"
OMNI_STAKING_UNSTAKE_TX=$(npx hardhat unstake --contract $OMNI_STAKING_CONTRACT --network goerli_testnet --json | jq -r '.hash')
echo $OMNI_STAKING_UNSTAKE_TX
OMNI_STAKING_UNSTAKE_CCTX=$(npx hardhat cctx $OMNI_STAKING_UNSTAKE_TX --json)
echo $OMNI_STAKING_UNSTAKE_CCTX

popd