import { ethers } from "ethers";

import {
  createCommand,
  createRevertOptions,
  getAbi,
  encodeMessage,
  approveZRC20,
} from "../common";

const main = async (options: any) => {
  const provider = new ethers.providers.JsonRpcProvider(options.rpc);
  const signer = new ethers.Wallet(options.privateKey, provider);

  const message = encodeMessage(options);
  const { abi } = getAbi(options.name);
  const contract = new ethers.Contract(options.contract, abi, signer);

  await approveZRC20({ ...options, signer });
  const tx = await contract.call(
    options.receiver,
    options.zrc20,
    message,
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

export const callCommand = createCommand("call")
  .requiredOption("-t, --types <types...>", "Parameter types as JSON string")
  .requiredOption("-v, --values <values...>", "The values of the parameters")
  .option("--data <data>", "The data to call")
  .option("--call-options-is-arbitrary-call", "Call any function", false)
  .option("--call-options-gas-limit", "The gas limit for the call", "500000")
  .option(
    "--function <function>",
    `Function to call (example: "hello(string)")`
  )
  .option("--zrc20 <address>", "The address of ZRC-20 to pay fees")
  .action(main);
