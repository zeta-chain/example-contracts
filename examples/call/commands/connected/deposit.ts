import { ethers } from "ethers";

import { createCommand, createRevertOptions, getAbi } from "../common";

const main = async (options: any) => {
  const provider = new ethers.providers.JsonRpcProvider(options.rpc);
  const signer = new ethers.Wallet(options.privateKey, provider);

  const { abi } = getAbi(options.name);
  const contract = new ethers.Contract(options.contract, abi, signer);

  const tx = await contract[
    "deposit(address,(address,bool,address,bytes,uint256))"
  ](options.receiver, createRevertOptions(options), {
    value: ethers.utils.parseEther(options.amount),
    gasLimit: options.gasLimit,
  });
  await tx.wait();

  console.log(`✅ Transaction sent: ${tx.hash}`);
};

export const depositCommand = createCommand("deposit")
  .requiredOption("-a, --amount <number>", "Amount to deposit")
  .action(main);
