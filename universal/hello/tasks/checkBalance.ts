import { task, types } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const main = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const [signer] = await hre.ethers.getSigners();

  // Get a generic ERC-20 contract instance
  const erc20 = await hre.ethers.getContractAt("IERC20", args.erc20Address, signer);

  try {
    // Query the balance of the provided address (e.g., VaultManager)
    const balance = await erc20.balanceOf(args.account);
    console.log(`Balance: ${hre.ethers.utils.formatUnits(balance, args.decimals)} tokens`);
  } catch (e) {
    console.error("Error querying balance:", e);
  }
};

task("check-balance", "Check the balance of an account for any ERC-20 contract", main)
  .addParam("erc20Address", "The address of the ERC-20 contract")
  .addParam("account", "The address of the account to check the balance for")
  .addOptionalParam("decimals", "The number of decimals used by the token", 18, types.int) // Default to 18 decimals
  .setAction(main);
