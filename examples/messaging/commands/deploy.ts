import { ethers } from "ethers";
import { loadContractArtifacts } from "./common";
import { Command } from "commander";

const main = async (options: any) => {
  const provider = new ethers.providers.JsonRpcProvider(options.rpc);
  const signer = new ethers.Wallet(options.privateKey, provider);

  const { abi, bytecode } = loadContractArtifacts("Example", "Messaging.sol");

  const contractFactory = new ethers.ContractFactory(abi, bytecode, signer);

  const contract = await contractFactory.deploy(
    options.gateway,
    signer.address, // owner
    options.router
  );

  await contract.deployed();
  const contractAddress = contract.address;

  console.log(
    JSON.stringify({
      contractAddress: contractAddress,
      deployer: signer.address,
      transactionHash: contract.deployTransaction?.hash,
    })
  );
};

export const deploy = new Command("deploy")
  .description("Deploy a messaging contract")
  .requiredOption("-r, --rpc <url>", "RPC URL")
  .requiredOption("-k, --private-key <key>", "Private key")
  .requiredOption(
    "-g, --gateway <address>",
    "Gateway address",
    "0x0c487a766110c85d301d96e33579c5b317fa4995"
  )
  .requiredOption(
    "-t, --router <address>",
    "Router address",
    "0x5BD35697D4a62DE429247cbBDCc5c47F70477775"
  )
  .action(main);
