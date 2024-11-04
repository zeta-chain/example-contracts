#!/bin/bash

set -e

if [ "$1" = "localnet" ]; then
  npx hardhat localnet --exit-on-error & sleep 10
fi

function nft_balance() {
  local ZETACHAIN=$(cast call "$CONTRACT_ZETACHAIN" "balanceOf(address)(uint256)" "$SENDER")
  local ETHEREUM=$(cast call "$CONTRACT_ETHEREUM" "balanceOf(address)(uint256)" "$SENDER")
  local BNB=$(cast call "$CONTRACT_BNB" "balanceOf(address)(uint256)" "$SENDER")
  echo -e "\n🖼️  NFT Balance"
  echo "---------------------------------------------"
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


CONTRACT_ZETACHAIN=$(npx hardhat deploy --network localhost --json | jq -r '.contractAddress')
echo -e "\n🚀 Deployed NFT contract on ZetaChain: $CONTRACT_ZETACHAIN"

CONTRACT_ETHEREUM=$(npx hardhat deploy --name Connected --json --network localhost --gateway "$GATEWAY_ETHEREUM" | jq -r '.contractAddress')
echo -e "🚀 Deployed NFT contract on EVM chain: $CONTRACT_ETHEREUM"

CONTRACT_BNB=$(npx hardhat deploy --name Connected --json --network localhost --gateway "$GATEWAY_BNB" | jq -r '.contractAddress')
echo -e "🚀 Deployed NFT contract on BNB chain: $CONTRACT_BNB"

echo -e "\n📮 User Address: $SENDER"

echo -e "\n🔗 Setting counterparty contracts..."
npx hardhat connected-set-counterparty --network localhost --contract "$CONTRACT_ETHEREUM" --counterparty "$CONTRACT_ZETACHAIN" --json &>/dev/null
npx hardhat connected-set-counterparty --network localhost --contract "$CONTRACT_BNB" --counterparty "$CONTRACT_ZETACHAIN" --json &>/dev/null
npx hardhat universal-set-counterparty --network localhost --contract "$CONTRACT_ZETACHAIN" --counterparty "$CONTRACT_ETHEREUM" --zrc20 "$ZRC20_ETHEREUM" --json &>/dev/null
npx hardhat universal-set-counterparty --network localhost --contract "$CONTRACT_ZETACHAIN" --counterparty "$CONTRACT_BNB" --zrc20 "$ZRC20_BNB" --json &>/dev/null

npx hardhat localnet-check
nft_balance

NFT_ID=$(npx hardhat mint --network localhost --json --contract "$CONTRACT_ZETACHAIN" --token-uri https://example.com/nft/metadata/1 | jq -r '.tokenId')
echo -e "\nMinted NFT with ID: $NFT_ID on ZetaChain."

npx hardhat localnet-check
nft_balance

echo -e "\nTransferring NFT: ZetaChain → Ethereum..."
npx hardhat transfer --network localhost --json --token-id "$NFT_ID" --from "$CONTRACT_ZETACHAIN" --to "$ZRC20_ETHEREUM" 

npx hardhat localnet-check
nft_balance

echo -e "\nTransferring NFT: Ethereum → BNB..."
npx hardhat transfer --network localhost --json --token-id "$NFT_ID" --from "$CONTRACT_ETHEREUM" --to "$ZRC20_BNB" --gas-amount 0.1

npx hardhat localnet-check
nft_balance

echo -e "\nTransferring NFT: BNB → ZetaChain..."
npx hardhat transfer --network localhost --json --token-id "$NFT_ID" --from "$CONTRACT_BNB"

npx hardhat localnet-check
nft_balance

npx hardhat localnet-stop