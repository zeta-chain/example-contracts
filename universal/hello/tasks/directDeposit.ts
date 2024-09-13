import { task, types } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const main = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const [signer] = await hre.ethers.getSigners();

  // Get a generic ERC-20 contract instance
  const vaultManager = await hre.ethers.getContractAt("VaultManager", args.vaultManagerAddress, signer);

  try {
    // Query the balance of the provided address (e.g., VaultManager)
    const shares = await vaultManager.depositIntoVault(args.amount);

    console.log("Deposited into vault");
  } catch (e) {
    console.error("Error querying balance:", e);
  }
};

task("direct-deposit", "Directly call the VaultManager to test it", main)
  .addParam("vaultManagerAddress", "The address of the VaultManager contract")
  .addParam("amount", "Amount to deposit")
  .setAction(main);
