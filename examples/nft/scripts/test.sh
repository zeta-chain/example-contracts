#!/bin/bash

set -e

echo -e "\n🚀 Compiling contracts..."
npx hardhat compile --force &>/dev/null

ZRC20=0x2ca7d64A7EFE2D62A725E2B35Cf7230D6677FfEe
GATEWAY=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
SENDER=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266


UNIVERSAL=$(npx hardhat deploy --network localhost --json | jq -r '.contractAddress')
echo -e "\n🚀 Deployed NFT contract on ZetaChain: $UNIVERSAL"

CONNECTED=$(npx hardhat deploy --name Connected --json --network localhost --gateway "$GATEWAY" | jq -r '.contractAddress')
echo -e "🚀 Deployed NFT contract on EVM chain: $CONNECTED"

echo -e "\n📮 User Address: $SENDER"

echo -e "\n🔗 Setting counterparty contracts..."
npx hardhat connected-set-counterparty --network localhost --contract "$CONNECTED" --counterparty "$UNIVERSAL" --json &>/dev/null
npx hardhat universal-set-counterparty --network localhost --contract "$UNIVERSAL" --counterparty "$CONNECTED" --zrc20 "$ZRC20" --json &>/dev/null
echo "✅ Counterparty contracts set successfully."

echo -e "\n🖼️  NFT Balance"
echo "---------------------------------------------"
ZETA_BAL=$(cast call "$UNIVERSAL" "balanceOf(address)(uint256)" "$SENDER")
EVM_BAL=$(cast call "$CONNECTED" "balanceOf(address)(uint256)" "$SENDER")
echo "🟢 ZetaChain NFT Balance: $ZETA_BAL"
echo "🔷 EVM Chain NFT Balance: $EVM_BAL"
echo "---------------------------------------------"

NFT_ID=$(npx hardhat mint --network localhost --json --contract "$UNIVERSAL" --token-uri https://example.com/nft/metadata/1 | jq -r '.tokenId')
echo -e "\n🖼️  Minted NFT with ID: $NFT_ID on ZetaChain."

echo -e "\n🖼️  NFT Balance"
echo "---------------------------------------------"
ZETA_BAL=$(cast call "$UNIVERSAL" "balanceOf(address)(uint256)" "$SENDER")
EVM_BAL=$(cast call "$CONNECTED" "balanceOf(address)(uint256)" "$SENDER")
echo "🟢 ZetaChain NFT Balance: $ZETA_BAL"
echo "🔷 EVM Chain NFT Balance: $EVM_BAL"
echo "---------------------------------------------"

echo -e "\n🔄 Transferring NFT from ZetaChain to EVM chain."
SENDER=$(npx hardhat transfer --network localhost --contract "$UNIVERSAL" --token-id "$NFT_ID" --json --zrc20 "$ZRC20" --receiver "$CONNECTED" | jq -r '.sender')
echo -e "✅ Transfer complete."

echo -e "\n🖼️  NFT Balance"
echo "---------------------------------------------"
ZETA_BAL=$(cast call "$UNIVERSAL" "balanceOf(address)(uint256)" "$SENDER")
EVM_BAL=$(cast call "$CONNECTED" "balanceOf(address)(uint256)" "$SENDER")
echo "🟢 ZetaChain NFT Balance: $ZETA_BAL"
echo "🔷 EVM Chain NFT Balance: $EVM_BAL"
echo "---------------------------------------------"

echo -e "\n🔄 Transferring NFT from EVM chain to ZetaChain..."
npx hardhat transfer --network localhost --name Connected --contract "$CONNECTED" --token-id "$NFT_ID" --json --receiver "$UNIVERSAL" &>/dev/null
echo -e "✅ Transfer complete."

echo -e "\n🖼️  NFT Balance"
echo "---------------------------------------------"
ZETA_BAL_AFTER=$(cast call "$UNIVERSAL" "balanceOf(address)(uint256)" "$SENDER")
EVM_BAL_AFTER=$(cast call "$CONNECTED" "balanceOf(address)(uint256)" "$SENDER")
echo "🟢 ZetaChain NFT Balance: $ZETA_BAL_AFTER"
echo "🔷 EVM Chain NFT Balance: $EVM_BAL_AFTER"
echo "---------------------------------------------"
