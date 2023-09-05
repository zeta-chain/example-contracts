import { getAddress } from "@zetachain/protocol-contracts";
import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import ZRC20 from "@zetachain/protocol-contracts/abi/zevm/ZRC20.sol/ZRC20.json";

const main = async (args: any, hre: HardhatRuntimeEnvironment) => {
  if (hre.network.name !== "zeta_testnet") {
    throw new Error(
      '🚨 Please use the "zeta_testnet" network to deploy to ZetaChain.'
    );
  }

  const [signer] = await hre.ethers.getSigners();
  if (signer === undefined) {
    throw new Error(
      `Wallet not found. Please, run "npx hardhat account --save" or set PRIVATE_KEY env variable (for example, in a .env file)`
    );
  }
  console.log(`🔑 Using account: ${signer.address}\n`);

  const systemContract = getAddress("systemContract", "zeta_testnet");

  const factory = await hre.ethers.getContractFactory("Staking");

  const chainID = hre.config.networks[args.chain]?.chainId;
  if (chainID === undefined) {
    throw new Error(`🚨 Chain ${args.chain} not found in hardhat config.`);
  }

  const ZRC20Address = getAddress("zrc20", args.chain);
  const ZRC20Contract = new hre.ethers.Contract(
    ZRC20Address,
    ZRC20.abi,
    signer
  );

  const symbol = await ZRC20Contract.symbol();

  const contract = await factory.deploy(
    `Staking rewards for ${symbol}`,
    `R${symbol.toUpperCase()}`,
    chainID,
    systemContract
  );
  await contract.deployed();

  console.log(`🚀 Successfully deployed contract on ZetaChain.
📜 Contract address: ${contract.address}
🌍 Explorer: https://athens3.explorer.zetachain.com/address/${contract.address}
`);
};

task("deploy", "Deploy the contract", main).addParam("chain", "Chain name");
