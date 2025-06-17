import { ethers } from "ethers";

import { createCommand, createRevertOptions, getAbi } from "../common";

const main = async (options: any) => {
  const provider = new ethers.JsonRpcProvider(options.rpc);
  const signer = new ethers.Wallet(options.privateKey, provider);

  const { abi } = getAbi(options.name);
  const contract = new ethers.Contract(options.contract, abi, signer);

  const tx = await contract.deposit(
    options.receiver,
    createRevertOptions(options),
    { value: ethers.parseEther(options.amount) }
  );
  await tx.wait();

  console.log(`✅ Transaction sent: ${tx.hash}`);
};

export const connectedDepositCommand = createCommand("connected-deposit")
  .requiredOption("-a, --amount <number>", "Amount to deposit")
  .action(main);
