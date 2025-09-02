#!/usr/bin/env npx tsx

import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";
import { utils } from "ethers";
import { mainnet, testnet } from "@zetachain/protocol-contracts";
import { Command } from "commander";
import { bech32 } from "bech32";

export const SUI_CHAIN_ID_TO_NETWORK = {
  "103": "testnet",
  "104": "localnet",
  "105": "mainnet",
} as const;

export type SuiChainId = keyof typeof SUI_CHAIN_ID_TO_NETWORK;

export interface SuiDepositAndCallParams {
  amount: string;
  receiver: string;
  token?: string;
  types: string[];
  values: Array<string | bigint | boolean>;
}

const DEFAULT_GAS_BUDGET = 10_000_000n;
const SUI_GAS_COIN_TYPE = "0x2::sui::SUI";

const toSmallestUnit = (amount: string, decimals = 9): bigint => {
  if (!/^\d+(\.\d+)?$/.test(amount)) {
    throw new Error("Invalid decimal amount");
  }
  const [whole = "0", fraction = ""] = amount.split(".");

  if (fraction.length > decimals) {
    const truncatedPart = fraction.slice(decimals);
    if (/[1-9]/.test(truncatedPart)) {
      throw new Error(
        `Precision loss detected: Input has ${fraction.length} decimal places but only ${decimals} are supported. Non-zero digits would be lost: "${truncatedPart}"`
      );
    }
  }

  const paddedFraction = (fraction + "0".repeat(decimals)).slice(0, decimals);
  const multiplier = BigInt(10) ** BigInt(decimals);
  return BigInt(whole) * multiplier + BigInt(paddedFraction);
};

const getGatewayAddressFromChainId = (chainIdNumber: number): string | null => {
  const networks = [...testnet, ...mainnet];
  const match = networks.find(
    (n: any) => n.chain_id === chainIdNumber && n.type === "gateway"
  );
  return match?.address ?? null; // expected format: "<package>,<object>"
};

const resolveGatewayAndClient = (
  chainId: SuiChainId,
  gatewayPackage?: string,
  gatewayObject?: string
) => {
  const network = SUI_CHAIN_ID_TO_NETWORK[chainId];
  const client = new SuiClient({ url: getFullnodeUrl(network) });

  if (gatewayPackage && gatewayObject) {
    return { client, gatewayPackage, gatewayObject };
  }

  const address = getGatewayAddressFromChainId(Number(chainId));
  if (!address) {
    throw new Error("Gateway address not found");
  }
  const [pkg, obj] = address.split(",");
  if (!pkg || !obj) {
    throw new Error(
      "Invalid gateway address format. Expected '<package>,<object>'"
    );
  }

  return { client, gatewayPackage: pkg, gatewayObject: obj };
};

const getCoinObjectId = async (
  client: SuiClient,
  owner: string,
  coinType: string
): Promise<string> => {
  const coins = await client.getCoins({ owner, coinType });
  if (!coins.data.length) {
    throw new Error(`No coins of type ${coinType} found in this account`);
  }
  return coins.data[0].coinObjectId;
};

const getKeypairFromPrivateKey = (privateKey: string): Ed25519Keypair => {
  // Bech32 format (suiprivkey1...)
  if (privateKey.startsWith("suiprivkey1")) {
    const decoded = bech32.decode(privateKey);
    const words = bech32.fromWords(decoded.words);
    const keyBytes = Buffer.from(words.slice(1, 33)); // skip version byte
    if (keyBytes.length !== 32) {
      throw new Error(`Invalid Bech32 private key length: ${keyBytes.length}`);
    }
    return Ed25519Keypair.fromSecretKey(keyBytes);
  }

  // Hex format (optionally 0x-prefixed)
  const clean = privateKey.startsWith("0x") ? privateKey.slice(2) : privateKey;
  if (clean.length !== 64) {
    throw new Error(`Invalid hex key length: ${clean.length} (expected 64)`);
  }
  const bytes = Uint8Array.from(Buffer.from(clean, "hex"));
  return Ed25519Keypair.fromSecretKey(bytes);
};

export const suiDepositAndCall = async (
  params: SuiDepositAndCallParams,
  options: any
) => {
  if (!params.amount) throw new Error("amount is required");
  if (!params.receiver) throw new Error("receiver is required");
  if (!Array.isArray(params.types)) throw new Error("types must be an array");
  if (!Array.isArray(params.values)) throw new Error("values must be an array");
  if (params.types.length !== params.values.length) {
    throw new Error("types and values must have equal length");
  }
  if (!options?.signer) throw new Error("signer is required");

  const { client, gatewayObject, gatewayPackage } = resolveGatewayAndClient(
    options.chainId,
    options.gatewayPackage,
    options.gatewayObject
  );

  const gasBudget = options.gasLimit
    ? BigInt(options.gasLimit)
    : DEFAULT_GAS_BUDGET;

  const tx = new Transaction();
  const abiCoder = new utils.AbiCoder();
  const payloadABI = abiCoder.encode(params.types, params.values as any);

  const target = `${gatewayPackage}::gateway::deposit_and_call`;
  const gateway = tx.object(gatewayObject);
  const receiver = tx.pure.string(params.receiver);
  const payload = tx.pure.vector("u8", utils.arrayify(payloadABI));

  const coinType = params.token ?? SUI_GAS_COIN_TYPE;

  if (!params.token || params.token === SUI_GAS_COIN_TYPE) {
    const [splitCoin] = tx.splitCoins(tx.gas, [toSmallestUnit(params.amount)]);
    tx.moveCall({
      arguments: [gateway, splitCoin, receiver, payload],
      target,
      typeArguments: [SUI_GAS_COIN_TYPE],
    });
  } else {
    const coinObjectId = await getCoinObjectId(
      client,
      options.signer.toSuiAddress(),
      coinType
    );
    const [splitCoin] = tx.splitCoins(tx.object(coinObjectId), [
      toSmallestUnit(params.amount),
    ]);
    tx.moveCall({
      arguments: [gateway, splitCoin, receiver, payload],
      target,
      typeArguments: [coinType],
    });
  }

  tx.setGasBudget(gasBudget);

  const result = await client.signAndExecuteTransaction({
    signer: options.signer,
    transaction: tx,
    requestType: "WaitForLocalExecution",
    options: { showEffects: true, showEvents: true, showObjectChanges: true },
  });

  if (result.effects?.status.status === "failure") {
    const reason = (result.effects as any)?.status?.error ?? "unknown error";
    throw new Error(`Transaction failed: ${reason}`);
  }

  return result;
};

export const suiDepositAndCallCommand = new Command("sui-deposit-and-call")
  .summary("Deposit tokens from Sui and call a contract on ZetaChain")
  .requiredOption("--chain-id <chainId>", "Sui chain id: 101, 103, or 104")
  .requiredOption("--receiver <receiver>", "Receiver address on ZetaChain")
  .requiredOption("--amount <amount>", "Amount as decimal string")
  .requiredOption(
    "--private-key <privateKey>",
    "Ed25519 private key in hex (32 bytes) or suiprivkey1 format"
  )
  .option(
    "--coin-type <coinType>",
    "Coin type, defaults to SUI (0x2::sui::SUI)"
  )
  .option("--types <types...>", "ABI types for payload", [])
  .option("--values <values...>", "ABI values for payload", [])
  .option("--gas-budget <gasBudget>", "Gas budget as bigint string")
  .option("--gateway-package <pkg>", "Gateway package address override")
  .option("--gateway-object <obj>", "Gateway object id override")
  .action(async (opts: any) => {
    try {
      const signer = getKeypairFromPrivateKey(opts.privateKey);
      const types: string[] = Array.isArray(opts.types) ? opts.types : [];
      const values: Array<string | bigint | boolean> = Array.isArray(
        opts.values
      )
        ? opts.values
        : [];

      await suiDepositAndCall(
        {
          amount: String(opts.amount),
          receiver: String(opts.receiver),
          token: opts.coinType,
          types,
          values,
        },
        {
          chainId: String(opts.chainId) as SuiChainId,
          signer,
          gasLimit: opts.gasBudget,
          gatewayObject: opts.gatewayObject,
          gatewayPackage: opts.gatewayPackage,
        }
      );
    } catch (err) {
      console.error("deposit-and-call- error:", err);
      process.exitCode = 1;
    }
  });
