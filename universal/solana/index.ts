import * as anchor from "@coral-xyz/anchor";
import { Program, web3, BN } from "@coral-xyz/anchor";
import Gateway from "./gateway.json";
import { getKeypairFromFile } from "@solana-developers/helpers";

const DEVNET = "https://api.devnet.solana.com";
const PROGRAM_ID = "2kJndCL9NBR36ySiQ4bmArs4YgWQu67LmCDfLzk5Gb7s";
const SEED = "meta";
const MEMO = "0x3345664691f65614Ec3b76d451B1A005CEfF3b16";
const ID_JSON_PATH = "~/.config/solana/id.json";
const AMOUNT = 0.0001;

const main = async () => {
  const keypair = await getKeypairFromFile(ID_JSON_PATH);
  const wallet = new anchor.Wallet(keypair);

  const connection = new anchor.web3.Connection(DEVNET);
  const provider = new anchor.AnchorProvider(
    connection,
    wallet,
    anchor.AnchorProvider.defaultOptions()
  );
  anchor.setProvider(provider);

  const programId = new web3.PublicKey(PROGRAM_ID);
  const gatewayProgram = new Program(Gateway as anchor.Idl, provider);

  const seeds = [Buffer.from(SEED, "utf-8")];
  const [pdaAccount] = web3.PublicKey.findProgramAddressSync(seeds, programId);

  const depositAmount = new BN(web3.LAMPORTS_PER_SOL * AMOUNT);
  const memo = Buffer.from(MEMO);

  try {
    const tx = await gatewayProgram.methods
      .deposit(depositAmount, memo)
      .accounts({
        signer: wallet.publicKey,
        pda: pdaAccount,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Deposit transaction signature:", tx);

    const pdaBalance = await connection.getBalance(pdaAccount);
    console.log(
      "PDA account SOL balance:",
      pdaBalance / web3.LAMPORTS_PER_SOL,
      "SOL"
    );
  } catch (error) {
    console.error("Transaction failed:", error);
  }
};

main();
