import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const main = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const [signer] = await hre.ethers.getSigners();
  if (!signer) {
    throw new Error(
      `Wallet not found. Please, run "npx hardhat account --save" or set PRIVATE_KEY env variable (for example, in a .env file)`
    );
  }

  const contract = await hre.ethers.getContractAt(args.name, args.contract);

  const tx = await contract.setCounterparty(args.zrc20, args.counterparty);
  const receipt = await tx.wait();

  if (args.json) {
    console.log(
      JSON.stringify({
        contractAddress: args.contract,
        zrc20: args.zrc20,
        connectedContractAddress: args.counterparty,
        transactionHash: tx.hash,
      })
    );
  } else {
    console.log(`🚀 Successfully set the connected contract.
📜 Contract address: ${args.contract}
🔗 ZRC20 address: ${args.zrc20}
🔗 Connected contract address: ${args.contractAddress}
🔗 Transaction hash: ${tx.hash}`);
  }
};

task("universal-set-counterparty", "Sets the connected contract address", main)
  .addParam("contract", "The address of the deployed contract")
  .addParam("zrc20", "The ZRC20 address to link to the connected contract")
  .addParam("counterparty", "The address of the connected contract to set")
  .addOptionalParam("name", "The contract name to interact with", "Universal")
  .addFlag("json", "Output the result in JSON format");
