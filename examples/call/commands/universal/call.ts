import { ethers } from "ethers";

import { createCommand, createRevertOptions, getAbi } from "../common";
import ZRC20ABI from "@zetachain/protocol-contracts/abi/ZRC20.sol/ZRC20.json";

const main = async (options: any) => {
  const provider = new ethers.JsonRpcProvider(options.rpc);
  const signer = new ethers.Wallet(options.privateKey, provider);

  const message = ethers.AbiCoder.defaultAbiCoder().encode(
    options.types,
    options.values
  );

  const functionSignature = ethers.id(options.function).slice(0, 10);

  const payload = ethers.hexlify(ethers.concat([functionSignature, message]));

  const { abi } = getAbi(options.name);
  const contract = new ethers.Contract(options.contract, abi, signer);

  const zrc20 = new ethers.Contract(options.zrc20, ZRC20ABI.abi, signer);
  const [, gasFee] = await zrc20.withdrawGasFeeWithGasLimit(
    options.callOptionsGasLimit
  );
  const zrc20TransferTx = await zrc20.approve(options.contract, gasFee);

  await zrc20TransferTx.wait();

  const tx = await contract.call(
    options.receiver,
    options.zrc20,
    payload,
    {
      gasLimit: options.callOptionsGasLimit,
      isArbitraryCall: options.callOptionsIsArbitraryCall,
    },
    createRevertOptions(options),
    { gasLimit: options.gasLimit }
  );
  await tx.wait();

  console.log(`✅ Transaction sent: ${tx.hash}`);
};

export const universalCallCommand = createCommand("universal-call")
  .requiredOption("-t, --types <types...>", "Parameter types as JSON string")
  .requiredOption("-v, --values <values...>", "The values of the parameters")
  .option("--call-options-is-arbitrary-call", "Call any function", false)
  .option("--call-options-gas-limit", "The gas limit for the call", "500000")
  .option(
    "--function <function>",
    `Function to call (example: "hello(string)")`
  )
  .option("--zrc20 <address>", "The address of ZRC-20 to pay fees")
  .action(main);
