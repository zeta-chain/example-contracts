import * as anchor from "@coral-xyz/anchor";

import Connected_IDL from "../target/idl/connected.json";

async function initialize() {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = new anchor.Program(Connected_IDL as anchor.Idl);
  const txSig = await program.methods.initialize().rpc();
  console.log("Initialized connected program", txSig);
}

initialize().catch((err) => console.error("Initialize error:", err));
