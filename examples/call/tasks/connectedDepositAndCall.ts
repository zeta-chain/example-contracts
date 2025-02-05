import ERC20_ABI from "@openzeppelin/contracts/build/contracts/ERC20.json";
import { task, types } from "hardhat/config";
import type { HardhatRuntimeEnvironment } from "hardhat/types";

const main = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const { ethers } = hre;
  const [signer] = await ethers.getSigners();

  const revertOptions = {
    abortAddress: "0x0000000000000000000000000000000000000000", // not used
    callOnRevert: args.callOnRevert,
    onRevertGasLimit: args.onRevertGasLimit,
    revertAddress: args.revertAddress,
    revertMessage: ethers.utils.hexlify(
      ethers.utils.toUtf8Bytes(args.revertMessage)
    ),
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

  const factory = (await hre.ethers.getContractFactory(args.name)) as any;
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
      "depositAndCall(address,uint256,address,bytes,(address,bool,address,bytes,uint256))";
    tx = await contract[method](
      args.receiver,
      value,
      args.erc20,
      encodedParameters,
      revertOptions
    );
  } else {
    const value = hre.ethers.utils.parseEther(args.amount);
    const method =
      "depositAndCall(address,bytes,(address,bool,address,bytes,uint256))";
    tx = await contract[method](
      args.receiver,
      encodedParameters,
      revertOptions,
      { value }
    );
  }

  await tx.wait();
  console.log(`Transaction hash: ${tx.hash}`);
};

task(
  "connected-deposit-and-call",
  "Deposit tokens and make a call from a connected chain to a universal app on ZetaChain",
  main
)
  .addParam("contract", "The address of the deployed contract")
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
    500000,
    types.int
  )
  .addParam("amount", "The amount of tokens to deposit")
  .addParam("name", "The name of the contract", "Connected")
  .addOptionalParam("erc20", "The address of the ERC20 token to deposit")
  .addParam("types", `The types of the parameters (example: '["string"]')`)
  .addVariadicPositionalParam("values", "The values of the parameters");
