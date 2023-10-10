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

  const systemContract = getAddress("systemContract", "zeta_testnet");

  const factory = await hre.ethers.getContractFactory("Staking");
  let symbol, chainID;
  if (args.chain === "btc_testnet") {
    symbol = "BTC";
    chainID = 18332;
  } else {
    const zrc20 = getAddress("zrc20", args.chain);
    const contract = new hre.ethers.Contract(zrc20, ZRC20.abi, signer);
    symbol = await contract.symbol();
    chainID = hre.config.networks[args.chain]?.chainId;
    if (chainID === undefined) {
      throw new Error(`🚨 Chain ${args.chain} not found in hardhat config.`);
    }
  }

  const contract = await factory.deploy(
    `Staking rewards for ${symbol}`,
    `R${symbol.toUpperCase()}`,
    chainID,
    systemContract
  );
  await contract.deployed();

  if (args.json) {
    console.log(JSON.stringify(contract));
  } else {
    console.log(`🔑 Using account: ${signer.address}

🚀 Successfully deployed contract on ZetaChain.
📜 Contract address: ${contract.address}
🌍 Explorer: https://athens3.explorer.zetachain.com/address/${contract.address}
`);
  }
};

task("deploy", "Deploy the contract", main)
  .addParam("chain", "Chain ID (use btc_testnet for Bitcoin Testnet)")
  .addFlag("json", "Output in JSON");
