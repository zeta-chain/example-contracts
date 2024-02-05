#!/bin/bash

rm -rf abi && mkdir -p abi/messaging abi/omnichain
rm -rf typescript-types && mkdir typescript-types

for dir in ./messaging/*/ ./omnichain/*/; do
  subdir=$(echo $dir | cut -d'/' -f2)
  
  cd $dir && yarn && npx hardhat compile --force && cp -r artifacts/contracts/* ../../abi/$subdir/ && cd ../../;           
done

find ./abi/ -name '*.dbg.json' -exec rm {} \;