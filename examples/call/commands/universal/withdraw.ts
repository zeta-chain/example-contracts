import { ethers } from "ethers";

import {
  approveZRC20,
  createCommand,
  createRevertOptions,
  getAbi,
} from "../common";

const main = async (options: any) => {
  const provider = new ethers.providers.JsonRpcProvider(options.rpc);
  const signer = new ethers.Wallet(options.privateKey, provider);

  const { abi } = getAbi(options.name);
  const contract = new ethers.Contract(options.contract, abi, signer);

  const { decimals } = await approveZRC20({ ...options, signer });

  const tx = await contract.withdraw(
    options.receiver,
    ethers.utils.parseUnits(options.amount, decimals),
    options.zrc20,
    createRevertOptions(options),
    { gasLimit: options.gasLimit }
  );
  await tx.wait();

  console.log(`✅ Transaction sent: ${tx.hash}`);
};

export const withdrawCommand = createCommand("withdraw")
  .requiredOption("--amount <number>", "Amount to withdraw")
  .option("--zrc20 <address>", "The address of ZRC-20 to pay fees")
  .action(main);
