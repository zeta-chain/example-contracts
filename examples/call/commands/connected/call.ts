import { ethers } from "ethers";
import { parseAbiValues } from "@zetachain/toolkit/utils";

import { createCommand, createRevertOptions, getAbi } from "../common";

const main = async (options: any) => {
  const provider = new ethers.providers.JsonRpcProvider(options.rpc);
  const signer = new ethers.Wallet(options.privateKey, provider);

  const message = ethers.utils.defaultAbiCoder.encode(
    options.types,
    parseAbiValues(JSON.stringify(options.types), options.values)
  );

  const { abi } = getAbi(options.name);
  const contract = new ethers.Contract(options.contract, abi, signer);

  const tx = await contract.call(
    options.receiver,
    message,
    createRevertOptions(options),
    { gasLimit: options.gasLimit }
  );
  await tx.wait();

  console.log(`✅ Transaction sent: ${tx.hash}`);
};

export const callCommand = createCommand("call")
  .requiredOption("-t, --types <types...>", "Parameter types as JSON string")
  .requiredOption("-v, --values <values...>", "The values of the parameters")
  .action(main);
