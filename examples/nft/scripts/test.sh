#!/bin/bash

set -e
set -x

npx hardhat compile --force

UNIVERSAL=$(npx hardhat nft-deploy --network localhost --json | jq -r '.contractAddress')

CONNECTED=$(npx hardhat nft-deploy --name Connected --json --network localhost --gateway 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0 | jq -r '.contractAddress')

NFT_ID=$(npx hardhat nft-mint --network localhost --json --contract "$UNIVERSAL" --token-uri https://example.com/nft/metadata/1 | jq -r '.tokenId')

SENDER=$(npx hardhat nft-transfer --network localhost --contract "$UNIVERSAL" --token-id "$NFT_ID" --json --zrc20 0x2ca7d64A7EFE2D62A725E2B35Cf7230D6677FfEe --receiver "$CONNECTED" | jq -r '.sender')

cast call "$UNIVERSAL" "balanceOf(address)(uint256)" "$SENDER"

cast call "$CONNECTED" "balanceOf(address)(uint256)" "$SENDER"