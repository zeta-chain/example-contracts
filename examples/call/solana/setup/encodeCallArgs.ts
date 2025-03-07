import * as anchor from "@coral-xyz/anchor";
import { ethers } from "ethers";

// this script abi encodes accounts and data to be passed to connected programs
// in protocol this encoded bytes array is passed to GatewayZEVM.withdrawAndCall
const [pdaAccount] = anchor.web3.PublicKey.findProgramAddressSync(
  [Buffer.from("meta", "utf-8")],
  new anchor.web3.PublicKey("94U5AHQMKkV5txNJ17QPXWoh474PheGou6cNP2FEuL1d")
);
const [connectedPdaAccount] = anchor.web3.PublicKey.findProgramAddressSync(
  [Buffer.from("connected", "utf-8")],
  new anchor.web3.PublicKey("9BjVGjn28E58LgSi547JYEpqpgRoo1TErkbyXiRSNDQy")
);

// simple call example takes 3 accounts and data message
// connected pda account (writable)
// gateway pda account
// system account
const accounts = [
  {
    isWritable: true,
    publicKey: ethers.utils.hexlify(connectedPdaAccount.toBytes()),
  },
  { isWritable: false, publicKey: ethers.utils.hexlify(pdaAccount.toBytes()) },
  {
    isWritable: false,
    publicKey: ethers.utils.hexlify(
      anchor.web3.SystemProgram.programId.toBytes()
    ),
  },
];
const data = ethers.utils.hexlify(ethers.utils.toUtf8Bytes("hello"));

// accounts and data are abi encoded
const encoded = ethers.utils.defaultAbiCoder.encode(
  ["tuple(tuple(bytes32 publicKey, bool isWritable)[] accounts, bytes data)"],
  [[accounts, data]]
);

console.log(encoded);
