#!/bin/bash

set -e

if [ "$1" = "localnet" ]; then
  npx hardhat localnet --exit-on-error & sleep 10
fi

yarn deploy:localnet

npx hardhat swap-from-evm --network localhost --receiver 0x84eA74d481Ee0A5332c457a4d796187F6Ba67fEB --amount 1 --target 0x9fd96203f7b22bCF72d9DCb40ff98302376cE09c --recipient 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

npx hardhat localnet-check

npx hardhat swap-from-evm --network localhost --receiver 0x84eA74d481Ee0A5332c457a4d796187F6Ba67fEB --amount 1 --target 0x2ca7d64A7EFE2D62A725E2B35Cf7230D6677FfEe --recipient 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 --erc20 0x0B306BF915C4d645ff596e518fAf3F9669b97016

npx hardhat localnet-stop