import { ethers } from "ethers";
import { loadContractArtifacts } from "./common";
import { Command } from "commander";

const main = async (options: any) => {
  const provider = new ethers.providers.JsonRpcProvider(options.rpc);
  const signer = new ethers.Wallet(options.privateKey, provider);

  const { abi } = loadContractArtifacts("Example", "Messaging.sol");
  const contract = new ethers.Contract(options.contract, abi, signer);

  const txOptions = {
    gasPrice: options.gasPrice,
    gasLimit: options.gasLimit,
  };

  if (options.isArbitraryCall && !options.function) {
    throw new Error("You must provide a function to call");
  }

  let message;

  if (options.values && options.types) {
    const valuesArray = options.values.map((value: any, index: any) => {
      const type = options.types[index];

      if (type === "bool") {
        try {
          return JSON.parse(value.toLowerCase());
        } catch (e) {
          throw new Error(`Invalid boolean value: ${value}`);
        }
      } else if (type.startsWith("uint") || type.startsWith("int")) {
        return ethers.BigNumber.from(value);
      } else {
        return value;
      }
    });

    const encodedParameters = ethers.utils.defaultAbiCoder.encode(
      options.types,
      valuesArray
    );

    if (options.isArbitraryCall && options.function) {
      const functionSignature = ethers.utils.id(options.function).slice(0, 10);
      message = ethers.utils.hexlify(
        ethers.utils.concat([functionSignature, encodedParameters])
      );
    } else {
      message = encodedParameters;
    }
  } else {
    // If no values/types provided, use the message directly
    message = options.message || "0x";
  }

  const revertOptions = {
    abortAddress: options.abortAddress,
    callOnRevert: options.callOnRevert,
    onRevertGasLimit: options.onRevertGasLimit,
    revertAddress: options.revertAddress,
    revertMessage: ethers.utils.hexlify(
      ethers.utils.toUtf8Bytes(options.revertMessage)
    ),
  };

  let tx;

  if (options.erc20) {
    const erc20 = new ethers.Contract(
      options.erc20,
      [
        "function approve(address spender, uint256 amount) returns (bool)",
        "function transferFrom(address from, address to, uint256 amount) returns (bool)",
      ],
      signer
    );

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
    // Handle both gasAmount and amount parameters
    const gasAmount = ethers.utils.parseUnits(options.amount, 18);
    // Use the native gas version of sendMessage
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
        value: gasAmount,
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
      gasAmount: options.gasAmount,
      erc20: options.erc20,
      amount: options.amount,
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
  .requiredOption("-a, --gas-amount <amount>", "Gas amount to send", "0")
  .option("-m, --message <message>", "Message to send (hex format)")
  .option("-e, --erc20 <address>", "ERC20 token address for token transfer")
  .option("-n, --amount <amount>", "Amount of ERC20 tokens to transfer")
  .option("-l, --call-gas-limit <limit>", "Gas limit for the call", "1000000")
  .option("-p, --gas-price <price>", "Gas price", "10000000000")
  .option("-i, --gas-limit <limit>", "Gas limit", "10000000")
  .option("-f, --function <function>", "Function to call on destination chain")
  .option("-y, --types <types...>", "Parameter types (JSON array)")
  .option("-v, --values <values...>", "Parameter values")
  .option(
    "-b, --abort-address <address>",
    "Abort address",
    "0x0000000000000000000000000000000000000000"
  )
  .option(
    "-o, --revert-address <address>",
    "Revert address",
    "0x0000000000000000000000000000000000000000"
  )
  .option("-s, --revert-message <message>", "Revert message", "0x")
  .option("-u, --on-revert-gas-limit <limit>", "On revert gas limit", "1000000")
  .option("--call-on-revert", "Whether to call on revert", false)
  .option("--is-arbitrary-call", "Whether this is an arbitrary call")
  .action(main);
