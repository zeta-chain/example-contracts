import { getAddress, ParamChainName } from "@zetachain/protocol-contracts";
import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const main = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const network = hre.network.name as ParamChainName;

  // if (!/zeta_(testnet|mainnet)/.test(network)) {
  //   throw new Error(
  //     '🚨 Please use either "zeta_testnet" or "zeta_mainnet" network to deploy to ZetaChain.'
  //   );
  // }

  const [signer] = await hre.ethers.getSigners();
  if (signer === undefined) {
    throw new Error(
      `Wallet not found. Please, run "npx hardhat account --save" or set PRIVATE_KEY env variable (for example, in a .env file)`
    );
  }

  // const systemContract = getAddress("systemContract", network);

  const factory = await hre.ethers.getContractFactory(args.name);
  // const contract = await factory.deploy(systemContract);
  const contract = await factory.deploy();
  await contract.deployed();

  if (args.json) {
    console.log(JSON.stringify(contract));
  } else {
    console.log(`🔑 Using account: ${signer.address}

🚀 Successfully deployed contract on ${network}.
📜 Contract address: ${contract.address}
`);
  }
};

task("deploy", "Deploy the contract", main)
  .addFlag("json", "Output in JSON")
  .addOptionalParam("name", "Contract to deploy", "Hello");
