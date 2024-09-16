#!/bin/bash

rm -rf abi && mkdir -p abi/examples
rm -rf typescript-types && mkdir typescript-types

for dir in ./examples/*/ ./omnichain/*/; do
  subdir=$(echo $dir | cut -d'/' -f2)
  
  cd $dir && yarn && npx hardhat compile --force && cp -r artifacts/contracts/* ../../abi/examples/ && cd ../../;           
done

find ./abi/ -name '*.dbg.json' -exec rm {} \;
