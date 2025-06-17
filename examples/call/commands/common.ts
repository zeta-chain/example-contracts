import path from "path";
import fs from "fs";
import { ethers } from "ethers";
import { Command } from "commander";
import ZRC20ABI from "@zetachain/protocol-contracts/abi/ZRC20.sol/ZRC20.json";

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

export const approveZRC20 = async (
  zrc20Address: string,
  contract: string,
  amount: string,
  signer: ethers.Wallet,
  gasLimit?: number
) => {
  const zrc20 = new ethers.Contract(zrc20Address, ZRC20ABI.abi, signer);
  const [gasZRC20, gasFee] = gasLimit
    ? await zrc20.withdrawGasFeeWithGasLimit(gasLimit)
    : await zrc20.withdrawGasFee();

  const zrc20TransferTx = await zrc20.approve(contract, gasFee);
  await zrc20TransferTx.wait();

  const decimals = await zrc20.decimals();
  if (gasZRC20 === zrc20.target) {
    const targetTokenApprove = await zrc20.approve(
      contract,
      gasFee + ethers.parseUnits(amount, decimals)
    );
    await targetTokenApprove.wait();
  } else {
    const targetTokenApprove = await zrc20.approve(
      contract,
      ethers.parseUnits(amount, decimals)
    );
    await targetTokenApprove.wait();
    const gasZRC20Contract = new ethers.Contract(
      gasZRC20,
      ZRC20ABI.abi,
      signer
    );
    const gasFeeApprove = await gasZRC20Contract.approve(contract, gasFee);
    await gasFeeApprove.wait();
  }
  return { decimals };
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
    .option("-n, --name <contract>", "Contract name")
    .option(
      "--rpc <url>",
      "RPC endpoint",
      "https://zetachain-athens-evm.blockpi.network/v1/rpc/public"
    )
    .option("--gas-limit <number>", "Gas limit for the transaction", "1000000")
    .option("--private-key <key>", "Private key to sign the transaction");
};
