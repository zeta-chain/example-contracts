#!/bin/bash

set -e

function display_nft_balance() {
  echo -e "\n🖼️  NFT Balance"
  echo "---------------------------------------------"
  local ZETACHAIN=$(cast call "$UNIVERSAL" "balanceOf(address)(uint256)" "$SENDER")
  local ETHEREUM=$(cast call "$CONNECTED" "balanceOf(address)(uint256)" "$SENDER")
  local BNB=$(cast call "$CONNECTED_BNB" "balanceOf(address)(uint256)" "$SENDER")
  echo "🟢 ZetaChain: $ZETACHAIN"
  echo "🔵 EVM Chain: $ETHEREUM"
  echo "🟡 BNB Chain: $BNB"
  echo "---------------------------------------------"
}

echo -e "\n🚀 Compiling contracts..."
npx hardhat compile --force

ZRC20=0x2ca7d64A7EFE2D62A725E2B35Cf7230D6677FfEe # ZRC-20 of the gas token of Ethereum
ZRC20_BNB=0x65a45c57636f9BcCeD4fe193A602008578BcA90b # ZRC-20 of the gas token of Ethereum
GATEWAY=0x610178dA211FEF7D417bC0e6FeD39F05609AD788
GATEWAY_BNB=0x3Aa5ebB10DC797CAC828524e59A333d0A371443c
SENDER=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266


UNIVERSAL=$(npx hardhat deploy --network localhost --json | jq -r '.contractAddress')
echo -e "\n🚀 Deployed NFT contract on ZetaChain: $UNIVERSAL"

CONNECTED=$(npx hardhat deploy --name Connected --json --network localhost --chain-label "$ZRC20" --gateway "$GATEWAY" | jq -r '.contractAddress')
echo -e "🚀 Deployed NFT contract on EVM chain: $CONNECTED"

CONNECTED_BNB=$(npx hardhat deploy --name Connected --json --network localhost --chain-label "$ZRC20" --gateway "$GATEWAY_BNB" | jq -r '.contractAddress')
echo -e "🚀 Deployed NFT contract on BNB chain: $CONNECTED_BNB"

echo -e "\n📮 User Address: $SENDER"

echo -e "\n🔗 Setting counterparty contracts..."
npx hardhat connected-set-counterparty --network localhost --contract "$CONNECTED" --counterparty "$UNIVERSAL" --json &>/dev/null
npx hardhat connected-set-counterparty --network localhost --contract "$CONNECTED_BNB" --counterparty "$UNIVERSAL" --json &>/dev/null
npx hardhat universal-set-counterparty --network localhost --contract "$UNIVERSAL" --counterparty "$CONNECTED" --zrc20 "$ZRC20" --json &>/dev/null
npx hardhat universal-set-counterparty --network localhost --contract "$UNIVERSAL" --counterparty "$CONNECTED_BNB" --zrc20 "$ZRC20_BNB" --json &>/dev/null
echo "✅ Counterparty contracts set successfully."

display_nft_balance

NFT_ID=$(npx hardhat mint --network localhost --json --contract "$UNIVERSAL" --token-uri https://example.com/nft/metadata/1 | jq -r '.tokenId')
echo -e "\n🖼️  Minted NFT with ID: $NFT_ID on ZetaChain."

display_nft_balance

echo -e "\n🔄 Transferring NFT from ZetaChain to EVM chain."
SENDER=$(npx hardhat transfer --network localhost --contract "$UNIVERSAL" --token-id "$NFT_ID" --json --zrc20 "$ZRC20" --receiver "$CONNECTED" | jq -r '.sender')
echo -e "✅ Transfer complete."

display_nft_balance

echo -e "\n🔄 Transferring NFT from EVM chain to ZetaChain..."
npx hardhat transfer --network localhost --name Connected --contract "$CONNECTED" --token-id "$NFT_ID" --json --receiver "$UNIVERSAL" &>/dev/null
echo -e "✅ Transfer complete."

display_nft_balance

echo -e "\n🔄 Transferring NFT from ZetaChain to BNB chain."
SENDER=$(npx hardhat transfer --network localhost --contract "$UNIVERSAL" --token-id "$NFT_ID" --json --zrc20 "$ZRC20_BNB" --receiver "$CONNECTED_BNB" | jq -r '.sender')
echo -e "✅ Transfer complete."

display_nft_balance

echo -e "\n🔄 Transferring NFT from BNB chain to ZetaChain..."
npx hardhat transfer --network localhost --name Connected --contract "$CONNECTED_BNB" --token-id "$NFT_ID" --json --receiver "$UNIVERSAL" &>/dev/null
echo -e "✅ Transfer complete."

display_nft_balance