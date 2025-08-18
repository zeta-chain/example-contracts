import { Command } from "commander";
import { ethers } from "ethers";
import { getAbi } from "../../swap/commands/common";

const main = async (opts: any) => {
  const provider = new ethers.providers.JsonRpcProvider(opts.rpc);
  const signer = new ethers.Wallet(opts.privateKey, provider);

  const network = await provider.getNetwork();
  const networkInfo = network.name ?? network.chainId;

  try {
    const { abi, bytecode } = getAbi(opts.name);
    const factory = new ethers.ContractFactory(abi, bytecode, signer);
    const baseNonce = await signer.getTransactionCount("pending");
    const predictedImplementationAddress = ethers.utils.getContractAddress({
      from: signer.address,
      nonce: baseNonce,
    });
    const implementation = await factory.deploy({ nonce: baseNonce });
    const implTx = implementation.deployTransaction;

    const initData = new ethers.utils.Interface(abi).encodeFunctionData(
      "initialize",
      [opts.gateway, opts.uniswapRouter, opts.gasLimit, signer.address]
    );

    const { abi: proxyAbi, bytecode: proxyBytecode } = getAbi("ERC1967Proxy");

    const proxyFactory = new ethers.ContractFactory(
      proxyAbi,
      proxyBytecode,
      signer
    );
    const predictedProxyAddress = ethers.utils.getContractAddress({
      from: signer.address,
      nonce: baseNonce + 1,
    });
    const proxy = await proxyFactory.deploy(
      predictedImplementationAddress,
      initData,
      {
        nonce: baseNonce + 1,
        gasLimit: ethers.BigNumber.from(opts.txGasLimit || 4000000),
      }
    );
    const proxyTx = proxy.deployTransaction;

    console.log(
      JSON.stringify({
        contractAddress: predictedProxyAddress,
        implementationAddress: predictedImplementationAddress,
        deployer: signer.address,
        network: networkInfo,
        transactionHash: proxyTx?.hash,
        implementationTransactionHash: implTx?.hash,
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
  .description("Deploy a swap contract")
  .requiredOption(
    "-r, --rpc <url>",
    "RPC URL (default: testnet)",
    "https://zetachain-athens-evm.blockpi.network/v1/rpc/public"
  )
  .requiredOption("-k, --private-key <key>", "Private key")
  .option("-n, --name <name>", "Contract name", "Swap")
  .requiredOption(
    "-u, --uniswap-router <address>",
    "Uniswap V2 Router address (default: testnet)",
    "0x2ca7d64A7EFE2D62A725E2B35Cf7230D6677FfEe"
  )
  .option(
    "-g, --gateway <address>",
    "Gateway address (default: testnet)",
    "0x6c533f7fe93fae114d0954697069df33c9b74fd7"
  )
  .option("--gas-limit <number>", "Gas limit for the transaction", "1000000")
  .option(
    "--tx-gas-limit <number>",
    "Gas limit override for deployment transactions",
    "4000000"
  )
  .action((opts) => {
    opts.gasLimit = Number(opts.gasLimit);
    if (opts.txGasLimit) opts.txGasLimit = Number(opts.txGasLimit);
    main(opts).catch((err) => {
      console.error("Unhandled error:", err);
      process.exit(1);
    });
  });
