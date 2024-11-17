#!/bin/bash

set -e
set -x

if [ "$1" = "start" ]; then npx hardhat localnet --exit-on-error & sleep 10; fi

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

ZRC20_ETHEREUM=$(jq -r '.addresses[] | select(.type=="ZRC-20 ETH on 5") | .address' localnet.json)
ZRC20_BNB=$(jq -r '.addresses[] | select(.type=="ZRC-20 BNB on 97") | .address' localnet.json)
GATEWAY_ETHEREUM=$(jq -r '.addresses[] | select(.type=="gatewayEVM" and .chain=="ethereum") | .address' localnet.json)
GATEWAY_BNB=$(jq -r '.addresses[] | select(.type=="gatewayEVM" and .chain=="bnb") | .address' localnet.json)
SENDER=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

CONTRACT_ZETACHAIN=$(npx hardhat deploy --network localhost --gateway 0x5FC8d32690cc91D4c39d9d3abcBD16989F875707 --system-contract 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9 --json --gas-limit 1000000 | jq -r '.contractAddress')
echo -e "\n🚀 Deployed NFT contract on ZetaChain: $CONTRACT_ZETACHAIN"

CONTRACT_ETHEREUM=$(npx hardhat deploy --name Connected --json --network localhost --gas-limit 1000000 --gateway "$GATEWAY_ETHEREUM" | jq -r '.contractAddress')
echo -e "🚀 Deployed NFT contract on Ethereum: $CONTRACT_ETHEREUM"

CONTRACT_BNB=$(npx hardhat deploy --name Connected --json --network localhost --gas-limit 1000000 --gateway "$GATEWAY_BNB" | jq -r '.contractAddress')
echo -e "🚀 Deployed NFT contract on BNB chain: $CONTRACT_BNB"

echo -e "\n📮 User Address: $SENDER"

echo -e "\n🔗 Setting counterparty contracts..."
npx hardhat connected-set-counterparty --network localhost --contract "$CONTRACT_ETHEREUM" --counterparty "$CONTRACT_ZETACHAIN" --json &>/dev/null
npx hardhat connected-set-counterparty --network localhost --contract "$CONTRACT_BNB" --counterparty "$CONTRACT_ZETACHAIN" --json &>/dev/null
npx hardhat universal-set-counterparty --network localhost --contract "$CONTRACT_ZETACHAIN" --counterparty "$CONTRACT_ETHEREUM" --zrc20 "$ZRC20_ETHEREUM" --json &>/dev/null
npx hardhat universal-set-counterparty --network localhost --contract "$CONTRACT_ZETACHAIN" --counterparty "$CONTRACT_BNB" --zrc20 "$ZRC20_BNB" --json &>/dev/null

npx hardhat localnet-check
balance

NFT_ID=$(npx hardhat mint --network localhost --json --contract "$CONTRACT_ZETACHAIN" --token-uri https://example.com/nft/metadata/1 | jq -r '.tokenId')
echo -e "\nMinted NFT with ID: $NFT_ID on ZetaChain."

npx hardhat localnet-check
balance

echo -e "\nTransferring NFT: ZetaChain → Ethereum..."
npx hardhat transfer --network localhost --json --token-id "$NFT_ID" --from "$CONTRACT_ZETACHAIN" --to "$ZRC20_ETHEREUM"

npx hardhat localnet-check
balance

echo -e "\nTransferring NFT: Ethereum → BNB..."
npx hardhat transfer --network localhost --json --token-id "$NFT_ID" --from "$CONTRACT_ETHEREUM" --to "$ZRC20_BNB" --gas-amount 0.1

npx hardhat localnet-check
balance

echo -e "\nTransferring NFT: BNB → ZetaChain..."
npx hardhat transfer --network localhost --json --token-id "$NFT_ID" --from "$CONTRACT_BNB"

npx hardhat localnet-check
balance

if [ "$1" = "start" ]; then npx hardhat localnet-stop; fi