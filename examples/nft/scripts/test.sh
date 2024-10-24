#!/bin/bash

set -e
set -x

npx hardhat compile --force

ZRC20=0x2ca7d64A7EFE2D62A725E2B35Cf7230D6677FfEe
GATEWAY=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0

UNIVERSAL=$(npx hardhat deploy --network localhost --json | jq -r '.contractAddress')

CONNECTED=$(npx hardhat deploy --name Connected --json --network localhost --gateway "$GATEWAY" | jq -r '.contractAddress')

npx hardhat connected-set-counterparty --network localhost --contract "$CONNECTED" --counterparty "$UNIVERSAL" --json

npx hardhat universal-set-counterparty --network localhost --contract "$UNIVERSAL" --counterparty "$CONNECTED" --zrc20 "$ZRC20" --json

NFT_ID=$(npx hardhat mint --network localhost --json --contract "$UNIVERSAL" --token-uri https://example.com/nft/metadata/1 | jq -r '.tokenId')

SENDER=$(npx hardhat transfer --network localhost --contract "$UNIVERSAL" --token-id "$NFT_ID" --json --zrc20 "$ZRC20" --receiver "$CONNECTED" | jq -r '.sender')

cast call "$UNIVERSAL" "balanceOf(address)(uint256)" "$SENDER"

cast call "$CONNECTED" "balanceOf(address)(uint256)" "$SENDER"

npx hardhat transfer --network localhost --name Connected --contract "$CONNECTED" --token-id "$NFT_ID" --json --receiver "$UNIVERSAL"

cast call "$UNIVERSAL" "balanceOf(address)(uint256)" "$SENDER"

cast call "$CONNECTED" "balanceOf(address)(uint256)" "$SENDER"