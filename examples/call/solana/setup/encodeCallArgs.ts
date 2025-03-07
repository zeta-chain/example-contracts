import * as anchor from "@coral-xyz/anchor";
import { ethers } from "ethers";
const GATEWAY = new anchor.web3.PublicKey(
  "94U5AHQMKkV5txNJ17QPXWoh474PheGou6cNP2FEuL1d"
);
const CONNECTED_PROGRAM = new anchor.web3.PublicKey(
  "9BjVGjn28E58LgSi547JYEpqpgRoo1TErkbyXiRSNDQy"
);

async function encode() {
  const { getAssociatedTokenAddress } = await import("@solana/spl-token");
  const args = process.argv.slice(2);
  const msg = args[0];
  const mint = args[1];
  // this script abi encodes accounts and data to be passed to connected programs
  // in protocol this encoded bytes array is passed to GatewayZEVM.withdrawAndCall
  const mintPubkey = new anchor.web3.PublicKey(mint);

  const [pdaAccount] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("meta", "utf-8")],
    GATEWAY
  );
  const [connectedPdaAccount] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("connected", "utf-8")],
    CONNECTED_PROGRAM
  );

  const connectedPdaATA = await getAssociatedTokenAddress(
    mintPubkey,
    pdaAccount,
    true
  );

  const accounts = [
    {
      isWritable: true,
      publicKey: ethers.utils.hexlify(connectedPdaAccount.toBytes()),
    },
    {
      isWritable: true,
      publicKey: ethers.utils.hexlify(connectedPdaATA.toBytes()),
    },
    {
      isWritable: false,
      publicKey: ethers.utils.hexlify(mintPubkey.toBytes()),
    },
    {
      isWritable: false,
      publicKey: ethers.utils.hexlify(pdaAccount.toBytes()),
    },
    {
      isWritable: false,
      publicKey: ethers.utils.hexlify(
        anchor.utils.token.TOKEN_PROGRAM_ID.toBytes()
      ),
    },
    {
      isWritable: false,
      publicKey: ethers.utils.hexlify(
        anchor.web3.SystemProgram.programId.toBytes()
      ),
    },
  ];
  const data = ethers.utils.hexlify(ethers.utils.toUtf8Bytes(msg));

  // accounts and data are abi encoded
  const encoded = ethers.utils.defaultAbiCoder.encode(
    ["tuple(tuple(bytes32 publicKey, bool isWritable)[] accounts, bytes data)"],
    [[accounts, data]]
  );

  console.log(encoded);
}

encode().catch((err) =>
  console.error("Encode args for solana examples error:", err)
);
