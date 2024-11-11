import { task, types } from "hardhat/config";
import type { HardhatRuntimeEnvironment } from "hardhat/types";

const main = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const { ethers } = hre;
  const [signer] = await ethers.getSigners();

  const txOptions = {
    gasPrice: args.txOptionsGasPrice,
    gasLimit: args.txOptionsGasLimit,
  };

  const revertOptions = {
    abortAddress: "0x0000000000000000000000000000000000000000", // not used
    callOnRevert: args.callOnRevert,
    onRevertGasLimit: args.onRevertGasLimit,
    revertAddress: args.revertAddress,
    revertMessage: ethers.utils.hexlify(
      ethers.utils.toUtf8Bytes(args.revertMessage)
    ),
  };

  const factory = (await hre.ethers.getContractFactory("Connected")) as any;
  const contract = factory.attach(args.contract).connect(signer);

  const value = hre.ethers.utils.parseEther(args.amount);

  const tx = await contract.deposit(args.receiver, revertOptions, {
    value,
    ...txOptions,
  });

  await tx.wait();
  console.log(`Transaction hash: ${tx.hash}`);
};

task("connected-deposit", "Deposit tokens to ZetaChain", main)
  .addParam("contract", "The address of the deployed contract")
  .addOptionalParam(
    "txOptionsGasPrice",
    "The gas price for the transaction",
    10000000000,
    types.int
  )
  .addOptionalParam(
    "txOptionsGasLimit",
    "The gas limit for the transaction",
    7000000,
    types.int
  )
  .addFlag("callOnRevert", "Whether to call on revert")
  .addOptionalParam(
    "revertAddress",
    "Revert address",
    "0x0000000000000000000000000000000000000000"
  )
  .addOptionalParam("revertMessage", "Revert message", "")
  .addParam(
    "receiver",
    "The address of the receiver contract on a connected chain"
  )
  .addOptionalParam(
    "onRevertGasLimit",
    "The gas limit for the revert transaction",
    7000000,
    types.int
  )
  .addParam("amount", "The amount of tokens to deposit");
