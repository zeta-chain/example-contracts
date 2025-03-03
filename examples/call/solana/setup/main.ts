import * as anchor from "@coral-xyz/anchor";
import { exec } from "child_process";
import path from "path";
import util from "util";

import Connected_IDL from "../target/idl/connected.json";
const execAsync = util.promisify(exec);

process.env.ANCHOR_WALLET = path.resolve(
  process.env.HOME || process.env.USERPROFILE || "",
  ".config/solana/id.json"
);
process.env.ANCHOR_PROVIDER_URL = "http://localhost:8899";
anchor.setProvider(anchor.AnchorProvider.env());

const deployPath = path.resolve(__dirname, "../target/deploy/");
const keypairPath = `${path.resolve(__dirname)}/connected-keypair.json`;
const programPath = path.join(deployPath, "connected.so");
async function setup() {
  const { stdout } = await execAsync(
    `solana program deploy --program-id ${keypairPath} ${programPath} --url localhost`
  );
  console.log(`Connected program deployment output: ${stdout}`);
  await new Promise((r) => setTimeout(r, 1000));

  const connectedProgram = new anchor.Program(Connected_IDL as anchor.Idl);
  await connectedProgram.methods.initialize().rpc();
  console.log("Initialized connected program");
}

setup().catch((err) =>
  console.error("Deploy and init solana examples error:", err)
);
