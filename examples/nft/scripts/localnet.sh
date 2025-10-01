#!/bin/bash

set -e
set -x
set -o pipefail

yarn zetachain localnet start --anvil "--code-size-limit 1000000 -q" --force-kill --exit-on-error --no-analytics &

while [ ! -f "$HOME/.zetachain/localnet/registry.json" ]; do sleep 1; done

function balance() {
  local ZETACHAIN=$(cast call "$CONTRACT_ZETACHAIN" "balanceOf(address)(uint256)" "$RECIPIENT")
  local ETHEREUM=$(cast call "$CONTRACT_ETHEREUM" "balanceOf(address)(uint256)" "$RECIPIENT")
  local BNB=$(cast call "$CONTRACT_BNB" "balanceOf(address)(uint256)" "$RECIPIENT")
  echo -e "\n🖼️  NFT Balance"
  echo "---------------------------------------------"
  echo "🟢 ZetaChain: $ZETACHAIN"
  echo "🔵 Ethereum:  $ETHEREUM"
  echo "🟡 BNB Chain: $BNB"
  echo "---------------------------------------------"
}

forge build

ZRC20_ETHEREUM=$(jq -r '.addresses[] | select(.type=="ZRC-20 ETH.ETH on 11155112") | .address' localnet.json)
ZRC20_BNB=$(jq -r '.addresses[] | select(.type=="ZRC-20 BNB.BNB on 98") | .address' localnet.json)
GATEWAY_ZETACHAIN=$(jq -r '.addresses[] | select(.type=="gateway" and .chain=="zetachain") | .address' localnet.json)
GATEWAY_ETHEREUM=$(jq -r '.addresses[] | select(.type=="gateway" and .chain=="ethereum") | .address' localnet.json)
GATEWAY_BNB=$(jq -r '.addresses[] | select(.type=="gateway" and .chain=="bnb") | .address' localnet.json)
UNISWAP_ROUTER=$(jq -r '.addresses[] | select(.type=="uniswapRouterInstance" and .chain=="zetachain") | .address' localnet.json)
PRIVATE_KEY=$(jq -r '.private_keys[0]' ~/.zetachain/localnet/anvil.json) && echo $PRIVATE_KEY
RECIPIENT=$(cast wallet address $PRIVATE_KEY) && echo $RECIPIENT
RPC=http://localhost:8545

CONTRACT_ZETACHAIN=$(npx tsx commands deploy \
  --rpc "$RPC" \
  --private-key "$PRIVATE_KEY" \
  --name ZetaChainUniversalNFT \
  --uniswap-router "$UNISWAP_ROUTER" \
  --gateway "$GATEWAY_ZETACHAIN" \
  --gas-limit 1000000 | jq -r '.contractAddress')
echo -e "\n🚀 Deployed NFT contract on ZetaChain: $CONTRACT_ZETACHAIN"

HELLO=$(forge create Hello \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --broadcast \
  --json | jq -r .deployedTo) && echo $HELLO

CONTRACT_ETHEREUM=$(npx tsx commands deploy \
  --rpc "$RPC" \
  --private-key "$PRIVATE_KEY" \
  --name EVMUniversalNFT \
  --gateway "$GATEWAY_ETHEREUM" \
  --gas-limit 1000000 | jq -r '.contractAddress')
echo -e "🚀 Deployed NFT contract on Ethereum: $CONTRACT_ETHEREUM"

CONTRACT_BNB=$(npx tsx commands deploy \
  --rpc "$RPC" \
  --private-key "$PRIVATE_KEY" \
  --name EVMUniversalNFT \
  --gateway "$GATEWAY_BNB" \
  --gas-limit 1000000 | jq -r '.contractAddress')
echo -e "🚀 Deployed NFT contract on BNB chain: $CONTRACT_BNB"

cast send "$CONTRACT_ETHEREUM" "setUniversal(address)" "$CONTRACT_ZETACHAIN" --rpc-url "$RPC" --private-key "$PRIVATE_KEY" &>/dev/null
cast send "$CONTRACT_BNB" "setUniversal(address)" "$CONTRACT_ZETACHAIN" --rpc-url "$RPC" --private-key "$PRIVATE_KEY" &>/dev/null
cast send "$CONTRACT_ZETACHAIN" "setConnected(address,bytes)" "$ZRC20_ETHEREUM" "$CONTRACT_ETHEREUM" --rpc-url "$RPC" --private-key "$PRIVATE_KEY" &>/dev/null
cast send "$CONTRACT_ZETACHAIN" "setConnected(address,bytes)" "$ZRC20_BNB" "$CONTRACT_BNB" --rpc-url "$RPC" --private-key "$PRIVATE_KEY" &>/dev/null

yarn zetachain localnet check --no-analytics
balance

NFT_ID=$(npx tsx commands mint --rpc "$RPC" --private-key "$PRIVATE_KEY" --contract "$CONTRACT_ZETACHAIN" --token-uri https://example.com/nft/metadata/1 | jq -r '.tokenId')
echo -e "\nMinted NFT with ID: $NFT_ID on ZetaChain."

yarn zetachain localnet check --no-analytics
balance

echo -e "\nTransferring NFT: ZetaChain → Ethereum..."
npx tsx commands transfer --rpc "$RPC" --private-key "$PRIVATE_KEY" --contract "$CONTRACT_ZETACHAIN" --token-id "$NFT_ID" --destination "$ZRC20_ETHEREUM" --gas-amount 1

yarn zetachain localnet check --no-analytics
balance

echo -e "\nTransferring NFT: Ethereum → BNB..."
npx tsx commands transfer --rpc "$RPC" --private-key "$PRIVATE_KEY" --contract "$CONTRACT_ETHEREUM" --token-id "$NFT_ID" --destination "$ZRC20_BNB" --gas-amount 1

yarn zetachain localnet check --no-analytics
balance

echo -e "\nTransferring NFT: BNB → ZetaChain..."
npx tsx commands transfer --rpc "$RPC" --private-key "$PRIVATE_KEY" --contract "$CONTRACT_BNB" --token-id "$NFT_ID"

yarn zetachain localnet check --no-analytics
balance

NFT_ID=$(npx tsx commands mint --rpc "$RPC" --private-key "$PRIVATE_KEY" --contract "$CONTRACT_ZETACHAIN" --token-uri https://example.com/nft/metadata/1 | jq -r '.tokenId')
npx tsx commands transfer-and-call --rpc "$RPC" --private-key "$PRIVATE_KEY" --contract "$CONTRACT_ZETACHAIN" --token-id "$NFT_ID" --function "hello(bytes)" --payload 0x123 --receiver "$HELLO" --destination "$ZRC20_ETHEREUM" --gas-amount 1

yarn zetachain localnet check --no-analytics

NFT_ID=$(npx tsx commands mint --rpc "$RPC" --private-key "$PRIVATE_KEY" --contract "$CONTRACT_ETHEREUM" --token-uri https://example.com/nft/metadata/1 | jq -r '.tokenId')
npx tsx commands transfer-and-call --rpc "$RPC" --private-key "$PRIVATE_KEY" --contract "$CONTRACT_ETHEREUM" --token-id "$NFT_ID" --function "hello(bytes)" --payload 0x123 --receiver "$HELLO" --destination "$ZRC20_BNB" --gas-amount 1

yarn zetachain localnet check --no-analytics

NFT_ID=$(npx tsx commands mint --rpc "$RPC" --private-key "$PRIVATE_KEY" --contract "$CONTRACT_BNB" --token-uri https://example.com/nft/metadata/1 | jq -r '.tokenId')
npx tsx commands transfer-and-call --rpc "$RPC" --private-key "$PRIVATE_KEY" --contract "$CONTRACT_BNB" --token-id "$NFT_ID" --function "hello(bytes)" --payload 0x123 --receiver "$HELLO"

yarn zetachain localnet stop --no-analytics
