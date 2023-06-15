import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { getAddress } from "@zetachain/protocol-contracts/lib";

const contractName = "ZetaSwapV2";

const main = async (args: any, hre: HardhatRuntimeEnvironment) => {
  if (hre.network.name !== "athens") {
    throw new Error(
      '🚨 Please use the "athens" network to deploy to ZetaChain.'
    );
  }

  const [signer] = await hre.ethers.getSigners();
  console.log(`🔑 Using account: ${signer.address}\n`);

  const SYSTEM_CONTRACT = getAddress("systemContract", hre.network.name);

  const factory = await hre.ethers.getContractFactory(contractName);
  const contract = await factory.deploy(SYSTEM_CONTRACT);
  await contract.deployed();

  console.log(`🚀 Successfully deployed contract on ZetaChain.
📜 Contract address: ${contract.address}
🌍 Explorer: https://explorer.zetachain.com/address/${contract.address}
`);
};

task("deploy", "Deploy the contract").setAction(main);
