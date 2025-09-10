#!/bin/bash

set -e
set -x
set -o pipefail

yarn zetachain localnet start --force-kill --exit-on-error --no-analytics &

while [ ! -f "localnet.json" ]; do sleep 1; done

function balance() {
  local ZETACHAIN=$(cast call "$CONTRACT_ZETACHAIN" "balanceOf(address)(uint256)" "$SENDER")
  local ETHEREUM=$(cast call "$CONTRACT_ETHEREUM" "balanceOf(address)(uint256)" "$SENDER")
  local BNB=$(cast call "$CONTRACT_BNB" "balanceOf(address)(uint256)" "$SENDER")
  echo -e "\n🖼️  NFT Balance"
  echo "---------------------------------------------"
  echo "🟢 ZetaChain: $ZETACHAIN"
  echo "🔵 Ethereum:  $ETHEREUM"
  echo "🟡 BNB Chain: $BNB"
  echo "---------------------------------------------"
}

echo -e "\n🚀 Compiling contracts..."
npx hardhat compile --force --quiet

ZRC20_ETHEREUM=$(jq -r '.addresses[] | select(.type=="ZRC-20 ETH.ETH on 11155112") | .address' localnet.json)
ZRC20_BNB=$(jq -r '.addresses[] | select(.type=="ZRC-20 BNB.BNB on 98") | .address' localnet.json)
GATEWAY_ZETACHAIN=$(jq -r '.addresses[] | select(.type=="gateway" and .chain=="zetachain") | .address' localnet.json)
GATEWAY_ETHEREUM=$(jq -r '.addresses[] | select(.type=="gateway" and .chain=="ethereum") | .address' localnet.json)
GATEWAY_BNB=$(jq -r '.addresses[] | select(.type=="gateway" and .chain=="bnb") | .address' localnet.json)
UNISWAP_ROUTER=$(jq -r '.addresses[] | select(.type=="uniswapRouterInstance" and .chain=="zetachain") | .address' localnet.json)
SENDER=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

CONTRACT_ZETACHAIN=$(npx hardhat nft:deploy --network localhost --name ZetaChainUniversalNFT --gateway "$GATEWAY_ZETACHAIN" --uniswap-router "$UNISWAP_ROUTER" --json | jq -r '.contractAddress')
echo -e "\n🚀 Deployed NFT contract on ZetaChain: $CONTRACT_ZETACHAIN"

CONTRACT_ETHEREUM=$(npx hardhat nft:deploy --name EVMUniversalNFT --json --network localhost --gateway "$GATEWAY_ETHEREUM" | jq -r '.contractAddress')
echo -e "🚀 Deployed NFT contract on Ethereum: $CONTRACT_ETHEREUM"

CONTRACT_BNB=$(npx hardhat nft:deploy --name EVMUniversalNFT --json --network localhost --gas-limit 1000000 --gateway "$GATEWAY_BNB" | jq -r '.contractAddress')
echo -e "🚀 Deployed NFT contract on BNB chain: $CONTRACT_BNB"

echo -e "\n📮 User Address: $SENDER"

echo -e "\n🔗 Setting universal and connected contracts..."
npx hardhat nft:set-universal --network localhost --contract "$CONTRACT_ETHEREUM" --universal "$CONTRACT_ZETACHAIN" --json
npx hardhat nft:set-universal --network localhost --contract "$CONTRACT_BNB" --universal "$CONTRACT_ZETACHAIN" --json &>/dev/null
npx hardhat nft:set-connected --network localhost --contract "$CONTRACT_ZETACHAIN" --connected "$CONTRACT_ETHEREUM" --zrc20 "$ZRC20_ETHEREUM" --json &>/dev/null
npx hardhat nft:set-connected --network localhost --contract "$CONTRACT_ZETACHAIN" --connected "$CONTRACT_BNB" --zrc20 "$ZRC20_BNB" --json &>/dev/null

yarn zetachain localnet check --no-analytics
balance

NFT_ID=$(npx hardhat nft:mint --network localhost --json --contract "$CONTRACT_ZETACHAIN" --token-uri https://example.com/nft/metadata/1 | jq -r '.tokenId')
echo -e "\nMinted NFT with ID: $NFT_ID on ZetaChain."

yarn zetachain localnet check --no-analytics
balance

echo -e "\nTransferring NFT: ZetaChain → Ethereum..."
npx hardhat nft:transfer --network localhost --json --token-id "$NFT_ID" --contract "$CONTRACT_ZETACHAIN" --destination "$ZRC20_ETHEREUM" --gas-amount 1

yarn zetachain localnet check --no-analytics
balance

echo -e "\nTransferring NFT: Ethereum → BNB..."
npx hardhat nft:transfer --network localhost --json --token-id "$NFT_ID" --contract "$CONTRACT_ETHEREUM" --destination "$ZRC20_BNB" --gas-amount 1

yarn zetachain localnet check --no-analytics
balance

echo -e "\nTransferring NFT: BNB → ZetaChain..."
npx hardhat nft:transfer --network localhost --json --token-id "$NFT_ID" --contract "$CONTRACT_BNB"

yarn zetachain localnet check --no-analytics
balance

yarn zetachain localnet stop --no-analytics