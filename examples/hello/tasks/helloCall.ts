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

  const callOptions = {
    gasLimit: args.txOptionsGasLimit,
    isArbitraryCall: args.isArbitraryCall,
  };

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

  let message: string;

  if (args.isArbitraryCall) {
    const functionSignature = ethers.utils.id(args.function).slice(0, 10);

    message = ethers.utils.hexlify(
      ethers.utils.concat([functionSignature, encodedParameters])
    );
  } else {
    message = encodedParameters;
  }

  const gasLimit = hre.ethers.BigNumber.from(args.txOptionsGasLimit);
  const zrc20 = new ethers.Contract(args.zrc20, ZRC20ABI.abi, signer);
  const [, gasFee] = await zrc20.withdrawGasFeeWithGasLimit(gasLimit);
  const zrc20TransferTx = await zrc20.approve(args.contract, gasFee, txOptions);

  await zrc20TransferTx.wait();

  const factory = (await hre.ethers.getContractFactory(args.name)) as any;
  const contract = factory.attach(args.contract);

  const tx = await contract.call(
    ethers.utils.hexlify(args.receiver),
    args.zrc20,
    message,
    callOptions,
    revertOptions,
    txOptions
  );

  console.log(`Transaction hash: ${tx.hash}`);
  await tx.wait();
};

task(
  "hello-call",
  "Calls the gatewayCall function on a contract on ZetaChain",
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
  .addParam("name", "The name of the contract", "Hello")
  .addOptionalParam("function", `Function to call (example: "hello(string)")`)
  .addFlag("isArbitraryCall", "Whether the call is arbitrary")
  .addParam("types", `The types of the parameters (example: '["string"]')`)
  .addVariadicPositionalParam("values", "The values of the parameters");
