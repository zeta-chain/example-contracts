import { ethers } from "ethers";
import { loadContractArtifacts } from "./common";
import { Command } from "commander";
import ERC20_ABI from "@openzeppelin/contracts/build/contracts/ERC20.json";
import { parseAbiValues } from "@zetachain/toolkit/utils";

const main = async (options: any) => {
  const provider = new ethers.providers.JsonRpcProvider(options.rpc);
  const signer = new ethers.Wallet(options.privateKey, provider);

  const { abi } = loadContractArtifacts("Example", "Messaging.sol");
  const contract = new ethers.Contract(options.contract, abi, signer);

  const txOptions = {
    gasPrice: options.gasPrice,
    gasLimit: options.gasLimit,
  };

  let message;

  if (options.values && options.types) {
    message = ethers.utils.defaultAbiCoder.encode(
      options.types,
      parseAbiValues(JSON.stringify(options.types), options.values)
    );
  } else {
    message = options.message;
  }

  const revertAddress =
    !options.revertAddress ||
    options.revertAddress === "0x0000000000000000000000000000000000000000"
      ? options.contract
      : options.revertAddress;

  const revertOptions = {
    abortAddress: options.abortAddress,
    callOnRevert: options.callOnRevert,
    onRevertGasLimit: options.onRevertGasLimit,
    revertAddress,
    revertMessage: ethers.utils.hexlify(
      ethers.utils.toUtf8Bytes(options.revertMessage)
    ),
  };

  let tx;

  if (options.erc20) {
    const erc20 = new ethers.Contract(options.erc20, ERC20_ABI.abi, signer);

    const amount = ethers.utils.parseUnits(options.amount, 18);
    const approveTx = await erc20.approve(options.contract, amount);
    await approveTx.wait();

    // Use the ERC20 version of sendMessage
    tx = await contract.functions[
      "sendMessage(bytes,address,uint256,address,bytes,uint256,(address,bool,address,bytes,uint256))"
    ](
      options.targetContract,
      options.targetToken,
      amount,
      options.erc20,
      message,
      options.callGasLimit,
      revertOptions,
      txOptions
    );
  } else {
    const amount = ethers.utils.parseUnits(options.amount, 18);
    tx = await contract.functions[
      "sendMessage(bytes,address,bytes,uint256,(address,bool,address,bytes,uint256))"
    ](
      options.targetContract,
      options.targetToken,
      message,
      options.callGasLimit,
      revertOptions,
      {
        ...txOptions,
        value: amount,
      }
    );
  }

  await tx.wait();

  console.log(
    JSON.stringify({
      contractAddress: options.contract,
      targetContract: options.targetContract,
      targetToken: options.targetToken,
      message: message,
      transactionHash: tx.hash,
      amount: options.amount,
      erc20: options.erc20,
    })
  );
};

export const message = new Command("message")
  .description("Send a cross-chain message")
  .requiredOption("-r, --rpc <url>", "RPC URL")
  .requiredOption("-k, --private-key <key>", "Private key")
  .requiredOption("-c, --contract <address>", "Contract address")
  .requiredOption("-t, --target-contract <address>", "Target contract address")
  .requiredOption("-g, --target-token <address>", "Target token address")
  .option("-m, --message <message>", "Message to send (hex format)")
  .option("-e, --erc20 <address>", "ERC20 token address for token transfer")
  .option("-n, --amount <amount>", "Amount of ERC20 tokens to transfer")
  .option("-l, --call-gas-limit <limit>", "Gas limit for the call", "1000000")
  .option("-p, --gas-price <price>", "Gas price", "10000000000")
  .option("-i, --gas-limit <limit>", "Gas limit", "10000000")
  .option("-y, --types <types...>", "Parameter types")
  .option("-v, --values <values...>", "Parameter values")
  .option(
    "-b, --abort-address <address>",
    "Abort address",
    "0x0000000000000000000000000000000000000000"
  )
  .option("-o, --revert-address <address>", "Revert address")
  .option("-s, --revert-message <message>", "Revert message", "")
  .option("-u, --on-revert-gas-limit <limit>", "On revert gas limit", "1000000")
  .option("--call-on-revert", "Whether to call on revert", false)
  .action(main);
