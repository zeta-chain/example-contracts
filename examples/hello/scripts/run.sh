#!/bin/bash

set -e

npx hardhat localnet --exit-on-error &

sleep 10

yarn deploy:localnet

npx hardhat echo-call \
  --contract 0x9E545E3C0baAB3E08CdfD552C960A1050f373042 \
  --receiver 0x84eA74d481Ee0A5332c457a4d796187F6Ba67fEB \
  --network localhost \
  --types '["uint256"]' 42

npx hardhat localnet-check

npx hardhat hello-call \
  --contract 0x84eA74d481Ee0A5332c457a4d796187F6Ba67fEB \
  --receiver 0x9E545E3C0baAB3E08CdfD552C960A1050f373042 \
  --zrc20 0x2ca7d64A7EFE2D62A725E2B35Cf7230D6677FfEe \
  --function "hello(string)" \
  --network localhost \
  --types '["string"]' alice

npx hardhat localnet-check

npx hardhat hello-withdraw-and-call \
  --contract 0x84eA74d481Ee0A5332c457a4d796187F6Ba67fEB \
  --receiver 0x9E545E3C0baAB3E08CdfD552C960A1050f373042 \
  --zrc20 0x9fd96203f7b22bCF72d9DCb40ff98302376cE09c \
  --function "hello(string)" \
  --amount 1 \
  --network localhost \
  --types '["string"]' hello

npx hardhat localnet-check

npx hardhat localnet-stop