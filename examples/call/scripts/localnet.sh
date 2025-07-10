#!/bin/bash

set -e
set -x
set -o pipefail

yarn zetachain localnet start --force-kill --exit-on-error &

while [ ! -f "localnet.json" ]; do sleep 1; done

npx hardhat compile --force --quiet

ZRC20_ETHEREUM=$(jq -r '.addresses[] | select(.type=="ZRC-20 ETH on 11155112") | .address' localnet.json)
ERC20_ETHEREUM=$(jq -r '.addresses[] | select(.type=="ERC-20 USDC" and .chain=="ethereum") | .address' localnet.json)
ZRC20_BNB=$(jq -r '.addresses[] | select(.type=="ZRC-20 BNB on 98") | .address' localnet.json)
GATEWAY_ETHEREUM=$(jq -r '.addresses[] | select(.type=="gateway" and .chain=="ethereum") | .address' localnet.json)
GATEWAY_ZETACHAIN=$(jq -r '.addresses[] | select(.type=="gateway" and .chain=="zetachain") | .address' localnet.json)
SENDER=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
PRIVATE_KEY=$(jq -r '.private_keys[0]' ~/.zetachain/localnet/anvil.json)
  
CONTRACT_ZETACHAIN=$(npx hardhat deploy --name Universal --network localhost --gateway "$GATEWAY_ZETACHAIN" --json | jq -r '.contractAddress')
echo -e "\n🚀 Deployed contract on ZetaChain: $CONTRACT_ZETACHAIN"

CONTRACT_ETHEREUM=$(npx hardhat deploy --name Connected --json --network localhost --gateway "$GATEWAY_ETHEREUM" | jq -r '.contractAddress')
echo -e "🚀 Deployed contract on Ethereum: $CONTRACT_ETHEREUM"

npx hardhat connected-deposit \
  --contract "$CONTRACT_ETHEREUM" \
  --receiver "$CONTRACT_ZETACHAIN" \
  --network localhost \
  --abort-address "$CONTRACT_ZETACHAIN" \
  --amount 1

yarn zetachain localnet check

npx hardhat connected-deposit \
  --contract "$CONTRACT_ETHEREUM" \
  --receiver "$CONTRACT_ZETACHAIN" \
  --network localhost \
  --erc20 "$ERC20_ETHEREUM" \
  --abort-address "$CONTRACT_ZETACHAIN" \
  --amount 1

yarn zetachain localnet check

npx hardhat connected-call \
  --contract "$CONTRACT_ETHEREUM" \
  --receiver "$CONTRACT_ZETACHAIN" \
  --network localhost \
  --abort-address "$CONTRACT_ZETACHAIN" \
  --types '["string"]' alice

yarn zetachain localnet check

npx hardhat connected-deposit-and-call \
  --contract "$CONTRACT_ETHEREUM" \
  --receiver "$CONTRACT_ZETACHAIN" \
  --network localhost \
  --amount 1 \
  --abort-address "$CONTRACT_ZETACHAIN" \
  --types '["string"]' alice

yarn zetachain localnet check

npx hardhat connected-deposit-and-call \
  --contract "$CONTRACT_ETHEREUM" \
  --receiver "$CONTRACT_ZETACHAIN" \
  --network localhost \
  --amount 1 \
  --erc20 "$ERC20_ETHEREUM" \
  --abort-address "$CONTRACT_ZETACHAIN" \
  --types '["string"]' alice

yarn zetachain localnet check

npx hardhat universal-withdraw \
  --contract "$CONTRACT_ZETACHAIN" \
  --receiver "$CONTRACT_ETHEREUM" \
  --zrc20 "$ZRC20_ETHEREUM" \
  --network localhost \
  --abort-address "$CONTRACT_ZETACHAIN" \
  --amount 1

yarn zetachain localnet check

npx hardhat universal-call \
  --contract "$CONTRACT_ZETACHAIN" \
  --receiver "$CONTRACT_ETHEREUM" \
  --zrc20 "$ZRC20_ETHEREUM" \
  --function "hello(string)" \
  --network localhost \
  --call-options-is-arbitrary-call \
  --abort-address "$CONTRACT_ZETACHAIN" \
  --types '["string"]' alice

yarn zetachain localnet check

npx hardhat universal-withdraw-and-call \
  --contract "$CONTRACT_ZETACHAIN" \
  --receiver "$CONTRACT_ETHEREUM" \
  --zrc20 "$ZRC20_ETHEREUM" \
  --function "hello(string)" \
  --amount 1 \
  --network localhost \
  --call-options-is-arbitrary-call \
  --abort-address "$CONTRACT_ZETACHAIN" \
  --types '["string"]' hello

yarn zetachain localnet check

npx hardhat universal-withdraw-and-call \
  --contract "$CONTRACT_ZETACHAIN" \
  --receiver "$CONTRACT_ETHEREUM" \
  --zrc20 "$ZRC20_ETHEREUM" \
  --amount 1 \
  --network localhost \
  --abort-address "$CONTRACT_ZETACHAIN" \
  --types '["string"]' hello

yarn zetachain localnet check

# Testing toolkit methods

yarn zetachain evm deposit \
  --receiver "$CONTRACT_ZETACHAIN" \
  --gateway "$GATEWAY_ETHEREUM" \
  --rpc http://localhost:8545 \
  --amount 1 \
  --yes \
  --private-key "$PRIVATE_KEY"

yarn zetachain localnet check

# doesn't work yet
# yarn zetachain evm deposit \
#   --receiver "$CONTRACT_ZETACHAIN" \
#   --gateway "$GATEWAY_ETHEREUM" \
#   --rpc http://localhost:8545 \
#   --erc20 "$ERC20_ETHEREUM" \
#   --amount 1 \
#   --yes \
#   --private-key "$PRIVATE_KEY"

# yarn zetachain localnet check

yarn zetachain evm call \
  --receiver "$CONTRACT_ZETACHAIN" \
  --gateway "$GATEWAY_ETHEREUM" \
  --rpc http://localhost:8545 \
  --types string \
  --values alice \
  --yes \
  --private-key "$PRIVATE_KEY"

yarn zetachain localnet check

yarn zetachain evm deposit-and-call \
  --receiver "$CONTRACT_ZETACHAIN" \
  --gateway "$GATEWAY_ETHEREUM" \
  --rpc http://localhost:8545 \
  --amount 1 \
  --types string \
  --values alice \
  --yes \
  --private-key "$PRIVATE_KEY"

yarn zetachain localnet check

# yarn zetachain evm deposit-and-call \
#   --receiver "$CONTRACT_ZETACHAIN" \
#   --gateway "$GATEWAY_ETHEREUM" \
#   --rpc http://localhost:8545 \
#   --amount 1 \
#   --erc20 "$ERC20_ETHEREUM" \
#   --types string \
#   --values alice \
#   --yes \
#   --private-key "$PRIVATE_KEY"

# yarn zetachain localnet check

yarn zetachain zetachain withdraw \
  --receiver "$CONTRACT_ETHEREUM" \
  --gateway "$GATEWAY_ZETACHAIN" \
  --zrc20 "$ZRC20_ETHEREUM" \
  --rpc http://localhost:8545 \
  --amount 1 \
  --yes \
  --private-key "$PRIVATE_KEY"

yarn zetachain localnet check

yarn zetachain localnet stop