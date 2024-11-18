import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const main = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const network = hre.network.name as any;

  const [signer] = await hre.ethers.getSigners();
  if (signer === undefined) {
    throw new Error(
      `Wallet not found. Please, run "npx hardhat account --save" or set PRIVATE_KEY env variable (for example, in a .env file)`
    );
  }

  const factory = await hre.ethers.getContractFactory(args.name);
  const contract = await (factory as any).deploy(
    args.gateway,
    args.uniswapRouter
  );
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

🚀 Successfully deployed contract on ${network}.
📜 Contract address: ${contract.address}
`);
  }
};

task("deploy", "Deploy the contract", main)
  .addFlag("json", "Output in JSON")
  .addOptionalParam("name", "Contract to deploy", "Swap")
  .addOptionalParam(
    "uniswapRouter",
    "Uniswap v2 Router address (default: ZetaChain TestnetGateway)",
    "0x2ca7d64A7EFE2D62A725E2B35Cf7230D6677FfEe"
  )
  .addOptionalParam(
    "gateway",
    "Gateway address (default: ZetaChain Gateway)",
    "0x6c533f7fe93fae114d0954697069df33c9b74fd7"
  );
