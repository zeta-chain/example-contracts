import { task, types } from "hardhat/config";
import type { HardhatRuntimeEnvironment } from "hardhat/types";
import ZRC20ABI from "@zetachain/protocol-contracts/abi/ZRC20.sol/ZRC20.json";

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

  const amount = hre.ethers.utils.parseUnits(args.amount, 18);

  const zrc20 = new ethers.Contract(args.zrc20, ZRC20ABI.abi, signer);
  const [gasZRC20, gasFee] = await zrc20.withdrawGasFee();
  const gasZRC20Contract = new ethers.Contract(gasZRC20, ZRC20ABI.abi, signer);
  const gasFeeApprove = await gasZRC20Contract.approve(
    args.contract,
    gasZRC20 == args.zrc20 ? gasFee.add(amount) : gasFee
  );
  await gasFeeApprove.wait();

  if (gasZRC20 !== args.zrc20) {
    const targetTokenApprove = await zrc20.approve(
      args.contract,
      gasFee.add(amount)
    );
    await targetTokenApprove.wait();
  }

  const factory = (await hre.ethers.getContractFactory(args.name)) as any;
  const contract = factory.attach(args.contract);

  const tx = await contract.withdraw(
    ethers.utils.hexlify(args.receiver),
    amount,
    args.zrc20,
    revertOptions
  );

  await tx.wait();
  console.log(`Transaction hash: ${tx.hash}`);
};

task("universal-withdraw", "Withdraw ZRC-20", main)
  .addParam("contract", "The address of the deployed Hello contract")
  .addParam("zrc20", "The address of ZRC-20 to pay fees")
  .addOptionalParam(
    "txOptionsGasPrice",
    "The gas price for the transaction",
    20000000000,
    types.int
  )
  .addOptionalParam(
    "txOptionsGasLimit",
    "The gas limit for the transaction",
    500000,
    types.int
  )
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
  .addOptionalParam("revertMessage", "Revert message", "0x")
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
  .addParam("name", "The name of the contract", "Universal")
  .addParam("amount", "Amount of ZRC-20 to withdraw");
