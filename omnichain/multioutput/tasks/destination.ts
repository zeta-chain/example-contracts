import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getAddress } from "@zetachain/protocol-contracts";

const main = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const [signer] = await hre.ethers.getSigners();
  console.log(`🔑 Using account: ${signer.address}\n`);

  const destinationTokens = args.destination.split(",");
  const ZetaMultiOutput = await hre.ethers.getContractAt(
    "MultiOutput",
    args.contract
  );

  const tx = await ZetaMultiOutput.registerDestinationToken(destinationTokens);

  await tx.wait();

  console.log(
    `Registered token ${destinationTokens} as destination tokens in the contract ${args.contract}`
  );
};

task("destination", "", main).addParam("contract").addParam("destination");
