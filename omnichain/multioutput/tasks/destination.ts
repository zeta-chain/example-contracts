import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getAddress } from "@zetachain/protocol-contracts";

const main = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const [signer] = await hre.ethers.getSigners();
  console.log(`🔑 Using account: ${signer.address}\n`);

  const destinationToken = getAddress("zrc20" as any, args.destination as any);
  const ZetaMultiOutput = await hre.ethers.getContractAt(
    "MultiOutput",
    args.contract
  );

  const tx = await ZetaMultiOutput.registerDestinationToken(destinationToken);

  await tx.wait();

  console.log(
    `Registered token ${destinationToken} as a destination in the contract ${args.contract}`
  );
};

task("destination", "", main).addParam("contract").addParam("destination");
