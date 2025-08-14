import { ethers } from "ethers";

import { createCommand, createRevertOptions, getAbi } from "../common";
import { parseAbiValues } from "@zetachain/toolkit/utils";

const main = async (options: any) => {
  const provider = new ethers.providers.JsonRpcProvider(options.rpc);
  const signer = new ethers.Wallet(options.privateKey, provider);

  const message = ethers.utils.defaultAbiCoder.encode(
    options.types,
    parseAbiValues(JSON.stringify(options.types), options.values)
  );

  const { abi } = getAbi(options.name);
  const contract = new ethers.Contract(options.contract, abi, signer);

  const tx = await contract[
    "depositAndCall(address,bytes,(address,bool,address,bytes,uint256))"
  ](options.receiver, message, createRevertOptions(options), {
    value: ethers.utils.parseEther(options.amount),
    gasLimit: options.gasLimit,
  });
  await tx.wait();

  console.log(`✅ Transaction sent: ${tx.hash}`);
};

export const depositAndCallCommand = createCommand("deposit-and-call")
  .requiredOption("-t, --types <types...>", "Parameter types as JSON string")
  .requiredOption("-v, --values <values...>", "The values of the parameters")
  .requiredOption("-a, --amount <number>", "Amount to deposit")
  .action(main);
