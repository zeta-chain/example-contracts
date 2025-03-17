import ERC20_ABI from "@openzeppelin/contracts/build/contracts/ERC20.json";
import { task, types } from "hardhat/config";
import type { HardhatRuntimeEnvironment } from "hardhat/types";

const main = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const { ethers } = hre;
  const [signer] = await ethers.getSigners();

  const revertOptions = {
    abortAddress: args.abortAddress,
    callOnRevert: args.callOnRevert,
    onRevertGasLimit: args.onRevertGasLimit,
    revertAddress: args.revertAddress,
    revertMessage: ethers.utils.hexlify(
      ethers.utils.toUtf8Bytes(args.revertMessage)
    ),
  };

  const factory = (await hre.ethers.getContractFactory("Connected")) as any;
  const contract = factory.attach(args.contract).connect(signer);

  let tx;
  if (args.erc20) {
    const erc20Contract = new ethers.Contract(
      args.erc20,
      ERC20_ABI.abi,
      signer
    );
    const decimals = await erc20Contract.decimals();
    const value = hre.ethers.utils.parseUnits(args.amount, decimals);
    const approveTx = await erc20Contract
      .connect(signer)
      .approve(args.contract, value);
    await approveTx.wait();
    const method =
      "deposit(address,uint256,address,(address,bool,address,bytes,uint256))";
    tx = await contract[method](
      args.receiver,
      value,
      args.erc20,
      revertOptions
    );
  } else {
    const value = hre.ethers.utils.parseEther(args.amount);
    const method = "deposit(address,(address,bool,address,bytes,uint256))";
    tx = await contract[method](args.receiver, revertOptions, { value });
  }

  await tx.wait();
  console.log(`Transaction hash: ${tx.hash}`);
};

task("connected-deposit", "Deposit tokens to ZetaChain", main)
  .addParam("contract", "The address of the deployed contract")
  .addFlag("callOnRevert", "Whether to call on revert")
  .addOptionalParam(
    "revertAddress",
    "Revert address",
    "0x0000000000000000000000000000000000000000"
  )
  .addOptionalParam(
    "abortAddress",
    "Abort address",
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
    500000,
    types.int
  )
  .addOptionalParam("erc20", "The address of the ERC20 token to deposit")
  .addParam("amount", "The amount of tokens to deposit");
