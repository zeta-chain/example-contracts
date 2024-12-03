import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const main = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const [signer] = await hre.ethers.getSigners();
  if (signer === undefined) {
    throw new Error(
      `Wallet not found. Please, run "npx hardhat account --save" or set PRIVATE_KEY env variable (for example, in a .env file)`
    );
  }

  const contract = await hre.ethers.getContractAt(
    args.name as "Universal" | "Connected",
    args.contract
  );

  const tx = await contract.checkIn();
  await tx.wait();
};

task("check-in", "Check in", main)
  .addParam("contract", "The address of the contract")
  .addOptionalParam(
    "to",
    "The recipient address, defaults to the signer address"
  )
  .addOptionalParam("name", "The contract name to interact with", "Connected")
  .addFlag("json", "Output the result in JSON format");
