import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const main = async (args: any, hre: HardhatRuntimeEnvironment) => {
  if (hre.network.name !== "athens") {
    throw new Error(
      '🚨 Please use the "athens" network to deploy to ZetaChain.'
    );
  }

  const [signer] = await hre.ethers.getSigners();
  console.log(`🔑 Using account: ${signer.address}\n`);

  const contract = await hre.ethers.getContractFactory("Withdraw");
  const withdraw = await contract.deploy();
  await withdraw.deployed();

  console.log(`🚀 Successfully deployed contract on ZetaChain.
📜 Contract address: ${withdraw.address}
🌍 Explorer: https://explorer.zetachain.com/address/${withdraw.address}
`);
};

task("deploy", "Deploy the contract").setAction(main);
