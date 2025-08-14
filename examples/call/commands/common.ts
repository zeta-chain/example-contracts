import path from "path";
import fs from "fs";
import { ethers } from "ethers";
import { Command } from "commander";
import ZRC20ABI from "@zetachain/protocol-contracts/abi/ZRC20.sol/ZRC20.json";
import { parseAbiValues } from "@zetachain/toolkit/utils";

export const getAbi = (name: string) => {
  const abiPath = path.resolve(
    __dirname,
    path.join("..", "out", `${name}.sol`, `${name}.json`)
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
    revertMessage: ethers.utils.hexlify(
      ethers.utils.toUtf8Bytes(options.revertMessage)
    ),
  };
};

export const approveZRC20 = async ({
  zrc20,
  contract,
  amount,
  signer,
  gasLimit,
}: {
  zrc20: string;
  contract: string;
  amount: string;
  signer: ethers.Wallet;
  gasLimit?: number;
}) => {
  const zrc20Contract = new ethers.Contract(zrc20, ZRC20ABI.abi, signer);

  const [gasZRC20, gasFee] = gasLimit
    ? await zrc20Contract.withdrawGasFeeWithGasLimit(gasLimit)
    : await zrc20Contract.withdrawGasFee();
  const zrc20TransferTx = await zrc20Contract.approve(contract, gasFee);
  await zrc20TransferTx.wait();

  const decimals = await zrc20Contract.decimals();

  if (gasZRC20 !== zrc20 && amount) {
    const targetTokenApprove = await zrc20Contract.approve(
      contract,
      ethers.utils.parseUnits(amount, decimals)
    );
    await targetTokenApprove.wait();
  }
  const gasZRC20Contract = new ethers.Contract(gasZRC20, ZRC20ABI.abi, signer);
  const gasFeeApprove = await gasZRC20Contract.approve(
    contract,
    amount ? ethers.utils.parseUnits(amount, decimals) + gasFee : gasFee
  );
  await gasFeeApprove.wait();
  return { decimals };
};

export type EncodeMessageOptions = {
  data?: string;
  types?: string[];
  values?: string[];
  function?: string;
};

export const encodeMessage = (options: EncodeMessageOptions): string => {
  if (options.data) {
    return options.data.startsWith("0x") ? options.data : `0x${options.data}`;
  }

  if (options.types && options.values) {
    const typesJson = JSON.stringify(options.types);
    const typedArgs = parseAbiValues(typesJson, options.values);
    const encodedParameters = ethers.utils.defaultAbiCoder.encode(
      JSON.parse(typesJson),
      typedArgs
    );

    if (options.function) {
      const functionSelector = ethers.utils.id(options.function).slice(0, 10);
      return ethers.utils.hexConcat([functionSelector, encodedParameters]);
    }

    return encodedParameters;
  }
  return "";
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
    .option("--revert-message <string>", "Revert message", "")
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
