import { Command } from "commander";
import { ethers } from "ethers";
import { getAbi } from "./common";

const main = async (opts: any) => {
  const provider = new ethers.providers.JsonRpcProvider(opts.rpc);
  const signer = new ethers.Wallet(opts.privateKey, provider);

  const network = await provider.getNetwork();
  const networkInfo = network.name ?? network.chainId;

  try {
    const { abi, bytecode } = getAbi(opts.name);
    const factory = new ethers.ContractFactory(abi, bytecode, signer);

    const contract = await factory.deploy(opts.gateway);
    const tx = contract.deployTransaction;
    const predictedAddress = ethers.utils.getContractAddress({
      from: signer.address,
      nonce: tx.nonce,
    });

    console.log(
      JSON.stringify({
        contractAddress: predictedAddress,
        deployer: signer.address,
        network: networkInfo,
        transactionHash: tx?.hash,
      })
    );
  } catch (err) {
    console.error(
      "Deployment failed:",
      err instanceof Error ? err.message : err
    );
    process.exit(1);
  }
};

export const deploy = new Command("deploy")
  .description("Deploy the hello contract")
  .requiredOption(
    "-r, --rpc <url>",
    "RPC URL (default: testnet)",
    "https://zetachain-athens-evm.blockpi.network/v1/rpc/public"
  )
  .requiredOption("-k, --private-key <key>", "Private key")
  .option("-n, --name <name>", "Contract name", "Universal")
  .option(
    "-g, --gateway <address>",
    "Gateway address (default: testnet)",
    "0x6c533f7fe93fae114d0954697069df33c9b74fd7"
  )
  .action((opts) => {
    main(opts).catch((err) => {
      console.error("Unhandled error:", err);
      process.exit(1);
    });
  });
