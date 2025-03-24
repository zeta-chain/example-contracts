import { task, types } from "hardhat/config";
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

  const contract = await hre.upgrades.deployProxy(
    factory as any,
    [
      args.gateway,
      args.uniswapRouter,
      args.gasLimit,
      signer.address,
      args.wzeta,
    ],
    { kind: "uups" }
  );

  console.log(
    JSON.stringify({
      contractAddress: contract.address,
      deployer: signer.address,
      network: network,
    })
  );
};

task("deploy", "Deploy the contract", main)
  .addOptionalParam("name", "Contract to deploy", "Swap")
  .addOptionalParam("uniswapRouter", "Uniswap v3 Router address")
  .addOptionalParam(
    "gateway",
    "Gateway address (default: ZetaChain Gateway)",
    "0x6c533f7fe93fae114d0954697069df33c9b74fd7"
  )
  .addOptionalParam(
    "gasLimit",
    "Gas limit for the transaction",
    1000000,
    types.int
  )
  .addOptionalParam("wzeta", "WZETA token address");
