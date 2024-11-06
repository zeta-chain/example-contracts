import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { ethers } from "ethers";

const main = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const [signer] = await hre.ethers.getSigners();
  if (!signer) {
    throw new Error(
      `Wallet not found. Please, run "npx hardhat account --save" or set PRIVATE_KEY env variable (for example, in a .env file)`
    );
  }

  const contract = await hre.ethers.getContractAt(args.name, args.contract);

  const tx = await contract.setRouter(args.counterparty);
  const receipt = await tx.wait();

  if (args.json) {
    console.log(
      JSON.stringify({
        contractAddress: args.contract,
        universalContract: args.counterparty,
        transactionHash: tx.hash,
      })
    );
  } else {
    console.log(`🚀 Successfully set the universal contract.
📜 Contract address: ${args.contract}
🔗 Universal contract address: ${args.universalContract}
🔗 Transaction hash: ${tx.hash}`);
  }
};

task("connected-set-router", "Sets the universal contract address", main)
  .addParam("contract", "The address of the deployed contract")
  .addParam("counterparty", "The address of the universal contract to set")
  .addOptionalParam("name", "The contract name to interact with", "Connected")
  .addFlag("json", "Output the result in JSON format");
