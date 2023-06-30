import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const contractName = "Withdraw";

const main = async (args: any, hre: HardhatRuntimeEnvironment) => {
  if (hre.network.name !== "zeta_testnet") {
    throw new Error(
      '🚨 Please use the "zeta_testnet" network to deploy to ZetaChain.'
    );
  }

  const [signer] = await hre.ethers.getSigners();
  console.log(`🔑 Using account: ${signer.address}\n`);

  const factory = await hre.ethers.getContractFactory(contractName);
  const contract = await factory.deploy();
  await contract.deployed();

  console.log(`🚀 Successfully deployed contract on ZetaChain.
📜 Contract address: ${contract.address}
🌍 Explorer: https://athens3.explorer.zetachain.com/address/${contract.address}
`);
};

task("deploy", "Deploy the contract").setAction(main);
