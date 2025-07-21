import { ethers } from "ethers";
import { loadContractArtifacts } from "./common";
import { Command } from "commander";

const main = async (options: any) => {
  const provider = new ethers.providers.JsonRpcProvider(options.rpc);
  const signer = new ethers.Wallet(options.privateKey, provider);

  const { abi } = loadContractArtifacts("Example", "Messaging.sol");
  const contract = new ethers.Contract(options.contract, abi, signer);

  const tx = await contract.setConnected(
    options.zrc20,
    ethers.utils.arrayify(options.connected)
  );
  await tx.wait();

  console.log(
    JSON.stringify({
      contractAddress: options.contract,
      zrc20: options.zrc20,
      connected: options.connected,
      transactionHash: tx.hash,
    })
  );
};

export const connect = new Command("connect")
  .description("Connect a ZRC20 token to its corresponding contract")
  .requiredOption("-r, --rpc <url>", "RPC URL")
  .requiredOption("-k, --private-key <key>", "Private key")
  .requiredOption("-c, --contract <address>", "Contract address")
  .requiredOption("-z, --zrc20 <address>", "ZRC20 token address")
  .requiredOption("-a, --connected <address>", "Connected contract address")
  .action(main);
