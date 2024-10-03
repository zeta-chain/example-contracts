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

  const gasLimit = hre.ethers.BigNumber.from(args.gasLimit);
  const zrc20 = new ethers.Contract(args.zrc20, ZRC20ABI.abi, signer);
  const [, gasFee] = await zrc20.withdrawGasFeeWithGasLimit(gasLimit);
  const zrc20TransferTx = await zrc20.transfer(
    args.contract,
    gasFee,
    txOptions
  );

  await zrc20TransferTx.wait();

  const factory = await hre.ethers.getContractFactory("Hello");
  const contract = factory.attach(args.contract);

  const tx = await contract.gatewayCall(
    ethers.utils.hexlify(args.receiver),
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
  "gateway-call",
  "Calls the gatewayCall function on the Hello contract",
  main
)
  .addParam("contract", "The address of the deployed Hello contract")
  .addParam("zrc20", "The address of ZRC-20 to pay fees")
  .addOptionalParam(
    "gasLimit",
    "Gas limit for for a cross-chain call",
    7000000,
    types.int
  )
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
  .addParam("types", `The types of the parameters (example: '["string"]')`)
  .addVariadicPositionalParam("values", "The values of the parameters");

module.exports = {};
