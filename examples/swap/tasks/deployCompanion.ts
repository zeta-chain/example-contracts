import { task, types } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const main = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const network = hre.network.name;

  const [signer] = await hre.ethers.getSigners();
  if (signer === undefined) {
    throw new Error(
      `Wallet not found. Please, run "npx hardhat account --save" or set PRIVATE_KEY env variable (for example, in a .env file)`
    );
  }

  const factory = await hre.ethers.getContractFactory(args.name);
  const contract = await (factory as any).deploy(args.gateway);
  await contract.deployed();

  if (args.json) {
    console.log(
      JSON.stringify({
        contractAddress: contract.address,
        deployer: signer.address,
        network: network,
        transactionHash: contract.deployTransaction.hash,
      })
    );
  } else {
    console.log(`🔑 Using account: ${signer.address}

🚀 Successfully deployed "${args.name}" contract on ${network}.
📜 Contract address: ${contract.address}
`);
  }
};

task("deploy-companion", "Deploy the companion contract", main)
  .addFlag("json", "Output in JSON")
  .addOptionalParam("name", "Contract to deploy", "SwapCompanion")
  .addOptionalParam(
    "gateway",
    "Gateway address (default: EVM Gateway on testnet)",
    "0x0c487a766110c85d301d96e33579c5b317fa4995"
  );
