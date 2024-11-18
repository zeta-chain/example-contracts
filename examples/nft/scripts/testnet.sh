#!/bin/bash

set -e
set -x

npx hardhat compile --force --quiet

UNIVERSAL=$(npx hardhat deploy --name Universal --network zeta_testnet --gateway 0x6c533f7fe93fae114d0954697069df33c9b74fd7 --uniswap-router 0x2ca7d64A7EFE2D62A725E2B35Cf7230D6677FfEe --gas-limit 500000 --json | jq -r '.contractAddress')
CONNECTED_BASE=$(npx hardhat deploy --name Connected --network base_sepolia --gateway 0x0c487a766110c85d301d96e33579c5b317fa4995 --gas-limit 500000 --json | jq -r '.contractAddress')
CONNECTED_BNB=$(npx hardhat deploy --name Connected --network bsc_testnet --gateway 0x0c487a766110c85d301d96e33579c5b317fa4995 --gas-limit 500000 --json | jq -r '.contractAddress')

ZRC20_BASE=0x236b0DE675cC8F46AE186897fCCeFe3370C9eDeD
ZRC20_BNB=0xd97B1de3619ed2c6BEb3860147E30cA8A7dC9891

npx hardhat connected-set-counterparty --network base_sepolia --contract "$CONNECTED_BASE" --counterparty "$UNIVERSAL" --json

npx hardhat connected-set-counterparty --network bsc_testnet --contract "$CONNECTED_BNB" --counterparty "$UNIVERSAL" --json

npx hardhat universal-set-counterparty --network zeta_testnet --contract "$UNIVERSAL" --counterparty "$CONNECTED_BASE" --zrc20 "$ZRC20_BASE" --json

npx hardhat universal-set-counterparty --network zeta_testnet --contract "$UNIVERSAL" --counterparty "$CONNECTED_BNB" --zrc20 "$ZRC20_BNB" --json