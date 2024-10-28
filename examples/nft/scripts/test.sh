#!/bin/bash

set -e

function display_nft_balance() {
  echo -e "\n🖼️  NFT Balance"
  echo "---------------------------------------------"
  local ZETACHAIN=$(cast call "$UNIVERSAL" "balanceOf(address)(uint256)" "$SENDER")
  local ETHEREUM=$(cast call "$CONNECTED_ETHEREUM" "balanceOf(address)(uint256)" "$SENDER")
  local BNB=$(cast call "$CONNECTED_BNB" "balanceOf(address)(uint256)" "$SENDER")
  echo "🟢 ZetaChain: $ZETACHAIN"
  echo "🔵 EVM Chain: $ETHEREUM"
  echo "🟡 BNB Chain: $BNB"
  echo "---------------------------------------------"
}

echo -e "\n🚀 Compiling contracts..."
npx hardhat compile --force --quiet

ZRC20_ETHEREUM=0x2ca7d64A7EFE2D62A725E2B35Cf7230D6677FfEe # ZRC-20 of the gas token of Ethereum
ZRC20_BNB=0x65a45c57636f9BcCeD4fe193A602008578BcA90b # ZRC-20 of the gas token of BNB
GATEWAY_ETHEREUM=0x610178dA211FEF7D417bC0e6FeD39F05609AD788
GATEWAY_BNB=0x3Aa5ebB10DC797CAC828524e59A333d0A371443c
SENDER=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266


UNIVERSAL=$(npx hardhat deploy --network localhost --json | jq -r '.contractAddress')
echo -e "\n🚀 Deployed NFT contract on ZetaChain: $UNIVERSAL"

CONNECTED_ETHEREUM=$(npx hardhat deploy --name Connected --json --network localhost --chain-label "$ZRC20_ETHEREUM" --gateway "$GATEWAY_ETHEREUM" | jq -r '.contractAddress')
echo -e "🚀 Deployed NFT contract on EVM chain: $CONNECTED_ETHEREUM"

CONNECTED_BNB=$(npx hardhat deploy --name Connected --json --network localhost --chain-label "$ZRC20_BNB" --gateway "$GATEWAY_BNB" | jq -r '.contractAddress')
echo -e "🚀 Deployed NFT contract on BNB chain: $CONNECTED_BNB"

echo -e "\n📮 User Address: $SENDER"

echo -e "\n🔗 Setting counterparty contracts..."
npx hardhat connected-set-counterparty --network localhost --contract "$CONNECTED_ETHEREUM" --counterparty "$UNIVERSAL" --json &>/dev/null
npx hardhat connected-set-counterparty --network localhost --contract "$CONNECTED_BNB" --counterparty "$UNIVERSAL" --json &>/dev/null
npx hardhat universal-set-counterparty --network localhost --contract "$UNIVERSAL" --counterparty "$CONNECTED_ETHEREUM" --zrc20 "$ZRC20_ETHEREUM" --json &>/dev/null
npx hardhat universal-set-counterparty --network localhost --contract "$UNIVERSAL" --counterparty "$CONNECTED_BNB" --zrc20 "$ZRC20_BNB" --json &>/dev/null

display_nft_balance

NFT_ID=$(npx hardhat mint --network localhost --json --contract "$UNIVERSAL" --token-uri https://example.com/nft/metadata/1 | jq -r '.tokenId')
echo -e "\nMinted NFT with ID: $NFT_ID on ZetaChain."

display_nft_balance

echo -e "\nTransferring NFT: ZetaChain → Ethereum..."
npx hardhat transfer --network localhost --json --token-id "$NFT_ID" --contract "$UNIVERSAL" --receiver "$CONNECTED_ETHEREUM" --destination "$ZRC20_ETHEREUM" 

display_nft_balance

echo -e "\nTransferring NFT: Ethereum → BNB..."
npx hardhat transfer --network localhost --json --token-id "$NFT_ID" --contract "$CONNECTED_ETHEREUM" --receiver "$UNIVERSAL" --destination "$ZRC20_BNB" --name Connected --amount 0.1

display_nft_balance

echo -e "\nTransferring NFT: BNB → ZetaChain..."
npx hardhat transfer --network localhost --json --token-id "$NFT_ID" --contract "$CONNECTED_BNB" --receiver "$UNIVERSAL" --name Connected 

display_nft_balance