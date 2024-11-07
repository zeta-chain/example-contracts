#!/bin/bash

set -e
set -x

if [ "$1" = "localnet" ]; then npx hardhat localnet --exit-on-error & sleep 10; fi

echo -e "\n🚀 Compiling contracts..."
npx hardhat compile --force --quiet

ZRC20_ETHEREUM=$(jq -r '.addresses[] | select(.type=="ZRC-20 ETH on 5") | .address' localnet.json)
ZRC20_BNB=$(jq -r '.addresses[] | select(.type=="ZRC-20 BNB on 97") | .address' localnet.json)
GATEWAY_ETHEREUM=$(jq -r '.addresses[] | select(.type=="gatewayEVM" and .chain=="ethereum") | .address' localnet.json)
GATEWAY_BNB=$(jq -r '.addresses[] | select(.type=="gatewayEVM" and .chain=="bnb") | .address' localnet.json)
SENDER=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

CONTRACT_ZETACHAIN=$(npx hardhat deploy --network localhost --json | jq -r '.contractAddress')
echo -e "\n🚀 Deployed NFT contract on ZetaChain: $CONTRACT_ZETACHAIN"

CONTRACT_ETHEREUM=$(npx hardhat deploy --name Connected --json --network localhost --gateway "$GATEWAY_ETHEREUM" | jq -r '.contractAddress')
echo -e "🚀 Deployed NFT contract on EVM chain: $CONTRACT_ETHEREUM"

CONTRACT_BNB=$(npx hardhat deploy --name Connected --json --network localhost --gateway "$GATEWAY_BNB" | jq -r '.contractAddress')
echo -e "🚀 Deployed NFT contract on BNB chain: $CONTRACT_BNB"

echo -e "\n📮 User Address: $SENDER"

echo -e "\n🔗 Setting counterparty contracts..."
npx hardhat connected-set-counterparty --network localhost --contract "$CONTRACT_ETHEREUM" --counterparty "$CONTRACT_BNB" --json &>/dev/null
npx hardhat connected-set-counterparty --network localhost --contract "$CONTRACT_BNB" --counterparty "$CONTRACT_ETHEREUM" --json &>/dev/null
npx hardhat universal-set-counterparty --network localhost --contract "$CONTRACT_ZETACHAIN" --counterparty "$CONTRACT_ETHEREUM" --zrc20 "$ZRC20_ETHEREUM" --json &>/dev/null
npx hardhat universal-set-counterparty --network localhost --contract "$CONTRACT_ZETACHAIN" --counterparty "$CONTRACT_BNB" --zrc20 "$ZRC20_BNB" --json &>/dev/null
npx hardhat connected-set-router --network localhost --contract "$CONTRACT_ETHEREUM" --counterparty "$CONTRACT_ZETACHAIN" --json &>/dev/null
npx hardhat connected-set-router --network localhost --contract "$CONTRACT_BNB" --counterparty "$CONTRACT_ZETACHAIN" --json &>/dev/null

# npx hardhat localnet-check

echo -e "\nMaking an authenticated call..."
npx hardhat transfer --network localhost --json --from "$CONTRACT_ETHEREUM" --to "$ZRC20_BNB" --gas-amount 1 --call-on-revert --revert-address "$CONTRACT_ETHEREUM" --revert-message "hello" --types '["string"]' alice

# echo -e "\nMaking an arbitrary call..."
npx hardhat transfer --network localhost --json --from "$CONTRACT_ETHEREUM" --to "$ZRC20_BNB" --gas-amount 1 --call-options-is-arbitrary-call --function "hello(string)" --types '["string"]' alice

if [ "$1" = "localnet" ]; then npx hardhat localnet-stop; fi