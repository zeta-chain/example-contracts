import { task, types } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const main = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const [signer] = await hre.ethers.getSigners();

  // Get the MockUSDC contract instance
  const usdc = await hre.ethers.getContractAt("MockUSDC", args.usdcAddress, signer);

  // Convert 10000 USDC to the appropriate units (assuming 6 decimals)
  const amount = hre.ethers.utils.parseUnits("10000", 6);

  console.log(`Minting ${amount.toString()} USDC to VaultManager at address ${args.vaultManagerAddress}...`);

  try {
    // Mint 10000 USDC to the VaultManager contract
    const mintTx = await usdc.mint(args.vaultManagerAddress, amount);
    await mintTx.wait();

    console.log('Minting successful!');
  } catch (e) {
    console.error("Error minting USDC:", e);
  }
};

task("mint-usdc", "Mints 10000 USDC to the VaultManager contract", main)
  .addParam("usdcAddress", "The address of the MockUSDC contract")
  .addParam("vaultManagerAddress", "The address of the VaultManager contract")
  .setAction(main);
