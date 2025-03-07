import * as anchor from "@coral-xyz/anchor";

export const GATEWAY = new anchor.web3.PublicKey(
  "94U5AHQMKkV5txNJ17QPXWoh474PheGou6cNP2FEuL1d"
);
export const CONNECTED_PROGRAM = new anchor.web3.PublicKey(
  "9BjVGjn28E58LgSi547JYEpqpgRoo1TErkbyXiRSNDQy"
);

export const [pdaAccount] = anchor.web3.PublicKey.findProgramAddressSync(
  [Buffer.from("meta", "utf-8")],
  GATEWAY
);
export const [connectedPdaAccount] =
  anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("connected", "utf-8")],
    CONNECTED_PROGRAM
  );

// NOTE: same payer as in localnet
const PAYER_SECRET_KEY = [
  241, 170, 134, 107, 198, 204, 4, 113, 117, 201, 246, 19, 196, 39, 229, 23, 73,
  128, 156, 88, 136, 174, 226, 33, 12, 104, 73, 236, 103, 2, 169, 219, 224, 118,
  30, 35, 71, 2, 161, 234, 85, 206, 192, 21, 80, 143, 103, 39, 142, 40, 128,
  183, 210, 145, 62, 75, 10, 253, 218, 135, 228, 49, 125, 186,
];

export const payer: anchor.web3.Keypair = anchor.web3.Keypair.fromSecretKey(
  new Uint8Array(PAYER_SECRET_KEY)
);
