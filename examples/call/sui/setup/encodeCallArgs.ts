import { ethers } from "ethers";

async function encode() {
  // this script abi encodes type arguments, objects and the message to be passed to the Sui connected contract
  // in protocol this encoded bytes array is passed to GatewayZEVM.withdrawAndCall

  const args = process.argv.slice(2);

  if (args.length != 3) {
    throw new Error(`invalid argument number, expected 3, got ${args.length}`);
  }

  const typeArguments: string[] = args[0].split(",").map((s) => s.trim());
  const objects: string[] = args[1].split(",").map((s) =>
    ethers.utils.hexZeroPad(s.trim(), 32)
  );
  const message = args[2];

  // values are abi encoded
  const encoded = ethers.utils.defaultAbiCoder.encode(
    ["tuple(string[] typeArguments, bytes32[] objects, bytes message)"],
    [[typeArguments, objects, message]]
  );

  console.log(encoded);
}

encode().catch((err) =>
  console.error(`Encode args for sui examples error: ${err}, usage: encodeCall.ts <commaSeparatedTypeArguments> <commaSeparatedObjectIDs> <message>`,)
);
