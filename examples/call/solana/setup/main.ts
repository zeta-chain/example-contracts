import * as anchor from "@coral-xyz/anchor";

import Connected_IDL from "../target/idl/connected.json";

const ensureEnv = (key: string) => {
  if (!process.env[key]) {
    throw new Error(`${key} environment variable must be set`);
  }
};

const setupAnchor = () => {
  ensureEnv("ANCHOR_PROVIDER_URL");
  ensureEnv("ANCHOR_WALLET");
  anchor.setProvider(anchor.AnchorProvider.env());
};

async function initialize() {
  setupAnchor();

  const connectedProgram = new anchor.Program(Connected_IDL as anchor.Idl);
  const txSig = await connectedProgram.methods.initialize().rpc();
  console.log("Initialized connected program", txSig);
}

initialize().catch((err) =>
  console.error("Initialize solana example error:", err)
);
