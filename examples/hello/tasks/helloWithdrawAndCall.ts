import { task, types } from "hardhat/config";
import type { HardhatRuntimeEnvironment } from "hardhat/types";
import ZRC20ABI from "@zetachain/protocol-contracts/abi/ZRC20.sol/ZRC20.json";

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

  const functionSignature = ethers.utils.id(args.function).slice(0, 10);

  const types = JSON.parse(args.types);

  if (types.length !== args.values.length) {
    throw new Error(
      `The number of types (${types.length}) does not match the number of values (${args.values.length}).`
    );
  }

  const valuesArray = args.values.map((value: any, index: number) => {
    const type = types[index];

    if (type === "bool") {
      try {
        return JSON.parse(value.toLowerCase());
      } catch (e) {
        throw new Error(`Invalid boolean value: ${value}`);
      }
    } else if (type.startsWith("uint") || type.startsWith("int")) {
      return ethers.BigNumber.from(value);
    } else {
      return value;
    }
  });
  const encodedParameters = ethers.utils.defaultAbiCoder.encode(
    types,
    valuesArray
  );

  const message = ethers.utils.hexlify(
    ethers.utils.concat([functionSignature, encodedParameters])
  );

  const gasLimit = hre.ethers.BigNumber.from(args.txOptionsGasLimit);

  const amount = hre.ethers.utils.parseUnits(args.amount, 18);

  const zrc20 = new ethers.Contract(args.zrc20, ZRC20ABI.abi, signer);
  const [gasZRC20, gasFee] = await zrc20.withdrawGasFeeWithGasLimit(gasLimit);
  const gasZRC20Contract = new ethers.Contract(gasZRC20, ZRC20ABI.abi, signer);
  const gasFeeApprove = await gasZRC20Contract.approve(
    args.contract,
    gasZRC20 == args.zrc20 ? gasFee.add(amount) : gasFee,
    txOptions
  );
  await gasFeeApprove.wait();

  if (gasZRC20 !== args.zrc20) {
    const targetTokenApprove = await zrc20.approve(
      args.contract,
      gasFee.add(amount),
      txOptions
    );
    await targetTokenApprove.wait();
  }

  const factory = (await hre.ethers.getContractFactory(args.name)) as any;
  const contract = factory.attach(args.contract);

  const tx = await contract.withdrawAndCall(
    ethers.utils.hexlify(args.receiver),
    amount,
    args.zrc20,
    message,
    gasLimit,
    revertOptions,
    txOptions
  );

  console.log(`Transaction hash: ${tx.hash}`);
  await tx.wait();
  console.log("gatewayCall executed successfully");
};

task(
  "hello-withdraw-and-call",
  "Calls the gatewayWithdrawAndCall function on a contract on ZetaChain",
  main
)
  .addParam("contract", "The address of the deployed Hello contract")
  .addParam("zrc20", "The address of ZRC-20 to pay fees")
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
  .addOptionalParam("revertMessage", "Revert message", "0x")
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
  .addParam("function", `Function to call (example: "hello(string)")`)
  .addParam("name", "The name of the contract", "Hello")
  .addParam("amount", "Amount of ZRC-20 to withdraw")
  .addParam("types", `The types of the parameters (example: '["string"]')`)
  .addVariadicPositionalParam("values", "The values of the parameters");
