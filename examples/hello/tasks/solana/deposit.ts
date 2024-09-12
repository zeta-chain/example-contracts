import * as anchor from "@coral-xyz/anchor";
import { Program, web3, BN } from "@coral-xyz/anchor";
import Gateway_IDL from "./gateway.json";
import { getKeypairFromFile } from "@solana-developers/helpers";

const SEED = "meta";

export const deposit = async (args: {
  amount: number;
  memo: string;
  api: string;
  idPath: string;
}) => {
  const keypair = await getKeypairFromFile(args.idPath);
  const wallet = new anchor.Wallet(keypair);

  const connection = new anchor.web3.Connection(args.api);
  const provider = new anchor.AnchorProvider(
    connection,
    wallet,
    anchor.AnchorProvider.defaultOptions()
  );
  anchor.setProvider(provider);

  const programId = new web3.PublicKey(Gateway_IDL.address);
  const gatewayProgram = new Program(Gateway_IDL as anchor.Idl, provider);

  const seeds = [Buffer.from(SEED, "utf-8")];
  const [pdaAccount] = web3.PublicKey.findProgramAddressSync(seeds, programId);

  const depositAmount = new BN(web3.LAMPORTS_PER_SOL * args.amount);
  const memo = Buffer.from(args.memo);

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
