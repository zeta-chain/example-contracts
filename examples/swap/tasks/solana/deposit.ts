import * as anchor from "@coral-xyz/anchor";
import { BN, Program, web3 } from "@coral-xyz/anchor";
import { getKeypairFromFile } from "@solana-developers/helpers";
import { ethers } from "ethers";

import Gateway_IDL from "./gateway.json";

const SEED = "meta";

export const deposit = async (args: {
  amount: number;
  api: string;
  contract: string;
  idPath: string;
  params: any[];
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

  try {
    const tx = new web3.Transaction();
    const m = Buffer.from(
      ethers.utils.arrayify(
        args.contract +
          ethers.utils.defaultAbiCoder
            .encode(args.params[0], args.params[1])
            .slice(2)
      )
    );
    const depositInstruction = await gatewayProgram.methods
      .deposit(depositAmount, m)
      .accounts({
        pda: pdaAccount,
        signer: wallet.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .instruction();

    tx.add(depositInstruction);

    // Send the transaction
    const txSignature = await web3.sendAndConfirmTransaction(connection, tx, [
      keypair,
    ]);

    console.log("Transaction signature:", txSignature);
  } catch (error) {
    console.error("Transaction failed:", error);
  }
};
