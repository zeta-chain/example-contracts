#!/bin/bash

set -e

SENDER=0x2cD3D070aE1BD365909dD859d29F387AA96911e1

pushd "./omnichain/swap"

yarn

npx hardhat compile --force

echo "Testing omnichain Swap"

OMNI_SWAP_CONTRACT=$(npx hardhat deploy --network zeta_testnet --json | jq -r '.address')
OMNI_SWAP_TX=$(npx hardhat interact --contract $OMNI_SWAP_CONTRACT --network goerli_testnet --amount 0.01 --recipient $SENDER --target-token 0x48f80608B672DC30DC7e3dbBd0343c5F02C738Eb --json | jq -r '.hash')
echo $OMNI_SWAP_TX
OMNI_SWAP_CCTX=$(npx hardhat cctx $OMNI_SWAP_TX --json)
echo $OMNI_SWAP_CCTX

popd

pushd "./omnichain/staking"

yarn

npx hardhat compile --force

echo "Testing omnichain Staking"

OMNI_STAKING_CONTRACT=$(npx hardhat deploy --network zeta_testnet --chain goerli_testnet --json | jq -r '.address')

echo $OMNI_STAKING_CONTRACT

echo "Stake"
OMNI_STAKING_STAKE_TX=$(npx hardhat stake --amount 0.01 --contract $OMNI_STAKING_CONTRACT --beneficiary $SENDER --network goerli_testnet --json | jq -r '.hash')
echo $OMNI_STAKING_STAKE_TX
OMNI_STAKING_STAKE_CCTX=$(npx hardhat cctx $OMNI_STAKING_STAKE_TX --json)
echo $OMNI_STAKING_STAKE_CCTX

echo "Unstake"
OMNI_STAKING_UNSTAKE_TX=$(npx hardhat unstake --contract $OMNI_STAKING_CONTRACT --network goerli_testnet --json | jq -r '.hash')
echo $OMNI_STAKING_UNSTAKE_TX
OMNI_STAKING_UNSTAKE_CCTX=$(npx hardhat cctx $OMNI_STAKING_UNSTAKE_TX --json)
echo $OMNI_STAKING_UNSTAKE_CCTX

popd

pushd "./messaging/message"

yarn

npx hardhat compile --force

echo "Testing CCM Message"

CCM_MESSAGE_CONTRACT=$(npx hardhat deploy --networks goerli_testnet,mumbai_testnet --json)
CCM_MESSAGE_TX_OUT=$(npx hardhat interact --network goerli_testnet --contract $(echo $CCM_MESSAGE_CONTRACT | jq -r '.goerli_testnet') --message "Hello World" --destination mumbai_testnet --amount 0.05 --json )
echo $CCM_MESSAGE_TX_OUT
CCM_MESSAGE_TX=$(echo $CCM_MESSAGE_TX_OUT | jq -r '.hash')
echo $CCM_MESSAGE_TX
CCM_MESSAGE_CCTX=$(npx hardhat cctx $CCM_MESSAGE_TX --json)
echo $CCM_MESSAGE_CCTX

popd

pushd "./messaging/warriors"

yarn

npx hardhat compile --force

echo "Testing CCM Warriors"

CCM_NFT_CONTRACT=$(npx hardhat deploy --networks goerli_testnet,mumbai_testnet --json | jq -r '.goerli_testnet')
echo $CCM_NFT_CONTRACT

CCM_NFT_MINT=$(npx hardhat mint --network goerli_testnet --contract $CCM_NFT_CONTRACT --json)
CCM_NFT_TX_OUT=$(npx hardhat interact --network goerli_testnet --contract $CCM_NFT_CONTRACT --token $CCM_NFT_MINT --destination mumbai_testnet --amount 0.05 --to $SENDER --json)
echo $CCM_NFT_TX_OUT
CCM_NFT_TX=$(echo $CCM_NFT_TX_OUT | jq -r '.hash')
echo $CCM_NFT_TX
CCM_NFT_CCTX=$(npx hardhat cctx $CCM_NFT_TX --json)
echo $CCM_NFT_CCTX

popd

pushd "./messaging/counter"

yarn

npx hardhat compile --force

echo "Testing CCM Counter"

CCM_COUNTER_CONTRACT=$(npx hardhat deploy --networks goerli_testnet,mumbai_testnet --json | jq -r '.goerli_testnet')
echo $CCM_COUNTER_CONTRACT
CCM_COUNTER_TX_OUT=$(npx hardhat interact --network goerli_testnet --contract $CCM_COUNTER_CONTRACT --destination mumbai_testnet --amount 0.05 --json)
echo $CCM_COUNTER_TX_OUT
CCM_COUNTER_TX=$(echo $CCM_COUNTER_TX_OUT | jq -r '.hash')
echo $CCM_COUNTER_TX
CCM_COUNTER_CCTX=$(npx hardhat cctx $CCM_COUNTER_TX --json)
echo $CCM_COUNTER_CCTX

popd

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

pushd "./omnichain/multioutput"

yarn

npx hardhat compile --force

echo "Testing omnichain Multioutput"

OMNI_MULTIOUTPUT_CONTRACT=$(npx hardhat deploy --network zeta_testnet --json | jq -r '.address')
echo $OMNI_MULTIOUTPUT_CONTRACT

npx hardhat destination --contract $OMNI_MULTIOUTPUT_CONTRACT --network zeta_testnet --destination mumbai_testnet
OMNI_MULTIOUTPUT_TX=$(npx hardhat interact --contract $OMNI_MULTIOUTPUT_CONTRACT --network goerli_testnet --amount 0.05 --recipient $SENDER --json | jq -r '.hash')
echo $OMNI_MULTIOUTPUT_TX
OMNI_MULTIOUTPUT_CCTX=$(npx hardhat cctx $OMNI_MULTIOUTPUT_TX --json)
echo $OMNI_MULTIOUTPUT_CCTX

popd