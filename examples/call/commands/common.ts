import path from "path";
import fs from "fs";
import { ethers } from "ethers";
import { Command } from "commander";

export const getAbi = (name: string) => {
  const abiPath = path.resolve(
    __dirname,
    path.join("..", "artifacts", "contracts", `${name}.sol`, `${name}.json`)
  );
  return JSON.parse(fs.readFileSync(abiPath, "utf8"));
};

export const createRevertOptions = (options: {
  abortAddress: string;
  callOnRevert: boolean;
  onRevertGasLimit: string;
  revertAddress: string;
  revertMessage: string;
}) => {
  return {
    abortAddress: options.abortAddress,
    callOnRevert: options.callOnRevert,
    onRevertGasLimit: BigInt(options.onRevertGasLimit),
    revertAddress: options.revertAddress,
    revertMessage: ethers.hexlify(ethers.toUtf8Bytes(options.revertMessage)),
  };
};

export const createCommand = (name: string) => {
  return new Command(name)
    .requiredOption(
      "-c, --contract <address>",
      "The address of the deployed contract"
    )
    .requiredOption(
      "-r, --receiver <address>",
      "The address of the receiver contract"
    )
    .option("--call-on-revert", "Whether to call on revert", false)
    .option(
      "--revert-address <address>",
      "Revert address",
      "0x0000000000000000000000000000000000000000"
    )
    .option(
      "--abort-address <address>",
      "Abort address",
      "0x0000000000000000000000000000000000000000"
    )
    .option("--revert-message <string>", "Revert message", "0x")
    .option(
      "--on-revert-gas-limit <number>",
      "Gas limit for revert tx",
      "500000"
    )
    .option("-n, --name <contract>", "Contract name", "Connected")
    .option(
      "--rpc <url>",
      "RPC endpoint",
      "https://zetachain-athens-evm.blockpi.network/v1/rpc/public"
    )
    .option("--private-key <key>", "Private key to sign the transaction");
};
