#!/bin/bash

set -e
set -x

npx hardhat deploy --name Swap --network localhost --gateway 0x5FC8d32690cc91D4c39d9d3abcBD16989F875707 --json


npx hardhat swap-from-evm --network localhost --receiver 0xB0D4afd8879eD9F52b28595d31B441D079B2Ca07 --amount 10 --target 0xd97B1de3619ed2c6BEb3860147E30cA8A7dC9891 --recipient 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

# if [ "$1" = "localnet" ]; then npx hardhat localnet --exit-on-error & sleep 10; fi

# echo -e "\n🚀 Compiling contracts..."
# npx hardhat compile --force --quiet

# ZRC20_ETHEREUM=$(jq -r '.addresses[] | select(.type=="ZRC-20 ETH on 5") | .address' localnet.json)
# ZRC20_USDC=$(jq -r '.addresses[] | select(.type=="ZRC-20 USDC on 5") | .address' localnet.json)
# GATEWAY_ETHEREUM=$(jq -r '.addresses[] | select(.type=="gatewayEVM" and .chain=="ethereum") | .address' localnet.json)
# GATEWAY_ZETACHAIN=$(jq -r '.addresses[] | select(.type=="gatewayZEVM" and .chain=="zetachain") | .address' localnet.json)
# SENDER=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

# CONTRACT_ZETACHAIN=$(npx hardhat deploy --name Swap --network localhost --gateway "$GATEWAY_ZETACHAIN" --json | jq -r '.contractAddress')
# echo -e "\n🚀 Deployed contract on ZetaChain: $CONTRACT_ZETACHAIN"

# npx hardhat swap-from-evm \
#   --network localhost \
#   --receiver "$CONTRACT_ZETACHAIN" \
#   --amount 10 \
#   --target "$ZRC20_USDC" \
#   --recipient "$SENDER"

# npx hardhat localnet-check

# npx hardhat swap-from-evm --network localhost --receiver 0x84eA74d481Ee0A5332c457a4d796187F6Ba67fEB --amount 1 --target 0x2ca7d64A7EFE2D62A725E2B35Cf7230D6677FfEe --recipient 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 --erc20 0x0B306BF915C4d645ff596e518fAf3F9669b97016

# npx hardhat localnet-stop