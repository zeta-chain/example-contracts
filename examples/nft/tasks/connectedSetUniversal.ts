import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Connected } from "@/typechain-types";

const main = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const [signer] = await hre.ethers.getSigners();
  if (!signer) {
    throw new Error(
      `Wallet not found. Please, run "npx hardhat account --save" or set PRIVATE_KEY env variable (for example, in a .env file)`
    );
  }

  const contract: Connected = await hre.ethers.getContractAt(
    "Connected",
    args.contract
  );

  const tx = await contract.setUniversal(args.universal);
  const receipt = await tx.wait();

  if (args.json) {
    console.log(
      JSON.stringify({
        contractAddress: args.contract,
        universalContract: args.universal,
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

task("connected-set-universal", "Sets the universal contract address", main)
  .addParam("contract", "The address of the deployed contract")
  .addParam("universal", "The address of the universal contract to set")
  .addFlag("json", "Output the result in JSON format");
