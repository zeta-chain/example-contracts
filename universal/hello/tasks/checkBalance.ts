import { task, types } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const main = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const [signer] = await hre.ethers.getSigners();

  // Get the MockUSDC contract instance
  const usdc = await hre.ethers.getContractAt("MockUSDC", args.usdcAddress, signer);

  try {
    // Query the balance of the VaultManager contract
    const balance = await usdc.balanceOf(args.vaultManagerAddress);
    console.log(`VaultManager USDC Balance: ${hre.ethers.utils.formatUnits(balance, 6)} USDC`);
  } catch (e) {
    console.error("Error querying balance:", e);
  }
};

task("check-balance", "Check the USDC balance of the VaultManager contract", main)
  .addParam("usdcAddress", "The address of the MockUSDC contract")
  .addParam("vaultManagerAddress", "The address of the VaultManager contract")
  .setAction(main);
