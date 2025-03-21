import { ethers } from "ethers";

async function encode() {
  // this script abi encodes type arguments, objects and the message to be passed to the Sui connected contract
  // in protocol this encoded bytes array is passed to GatewayZEVM.withdrawAndCall

  const typeArguments: any[] = [];
  const objects: any[] = [];
  const message = ethers.utils.hexlify(ethers.utils.toUtf8Bytes(""));

  // accounts and data are abi encoded
  const encoded = ethers.utils.defaultAbiCoder.encode(
    ["tuple(string[] typeArguments, bytes32[] objects, bytes message)"],
    [[typeArguments, objects, message]]
  );

  console.log(encoded);
}

encode().catch((err) =>
  console.error("Encode args for sui examples error:", err)
);
