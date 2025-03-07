import * as anchor from "@coral-xyz/anchor";
import { exec } from "child_process";
import path from "path";
import util from "util";

import Connected_IDL from "../target/idl/connected.json";
import { connectedPdaAccount, payer, pdaAccount } from "./constants";

const deployPath = path.resolve(__dirname, "../target/deploy/");
const keypairPath = `${path.resolve(__dirname)}/connected-keypair.json`;
const programPath = path.join(deployPath, "connected.so");

const execAsync = util.promisify(exec);

const setupAnchor = () => {
  process.env.ANCHOR_WALLET = path.resolve(
    process.env.HOME || process.env.USERPROFILE || "",
    ".config/solana/id.json"
  );
  process.env.ANCHOR_PROVIDER_URL = "http://localhost:8899";
  anchor.setProvider(anchor.AnchorProvider.env());
};

async function setup() {
  const { getOrCreateAssociatedTokenAccount } = await import(
    "@solana/spl-token"
  );
  setupAnchor();

  const args = process.argv.slice(2);
  const mint = args[0];
  const mintPubkey = new anchor.web3.PublicKey(mint);

  const { stdout } = await execAsync(
    `solana program deploy --program-id ${keypairPath} ${programPath} --url localhost`
  );
  console.log(`Connected program deployment output: ${stdout}`);
  await new Promise((r) => setTimeout(r, 1000));

  await getOrCreateAssociatedTokenAccount(
    anchor.getProvider().connection,
    payer,
    mintPubkey,
    connectedPdaAccount,
    true
  );

  await getOrCreateAssociatedTokenAccount(
    anchor.getProvider().connection,
    payer,
    mintPubkey,
    pdaAccount,
    true
  );

  const connectedProgram = new anchor.Program(Connected_IDL as anchor.Idl);
  await connectedProgram.methods.initialize().rpc();
  console.log("Initialized connected program");
}

setup().catch((err) =>
  console.error("Deploy and init solana examples error:", err)
);
