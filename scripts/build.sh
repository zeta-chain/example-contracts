#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")"/.. && pwd)"

rm -rf "$ROOT_DIR/abi"
mkdir -p "$ROOT_DIR/abi/examples"
rm -rf "$ROOT_DIR/typescript-types"
mkdir -p "$ROOT_DIR/typescript-types"

for dir in "$ROOT_DIR"/examples/*/; do
  (
    cd "$dir"
    yarn
    forge build
    example_name="$(basename "$dir")"
    mkdir -p "$ROOT_DIR/abi/examples/$example_name"
    cp -R out/. "$ROOT_DIR/abi/examples/$example_name/"
  )
done

find "$ROOT_DIR/abi" -name '*.dbg.json' -exec rm {} \;