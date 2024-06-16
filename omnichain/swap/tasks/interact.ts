import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { parseUnits } from "@ethersproject/units";
import { getAddress } from "@zetachain/protocol-contracts";
import ERC20Custody from "@zetachain/protocol-contracts/abi/evm/ERC20Custody.sol/ERC20Custody.json";
import { prepareData } from "@zetachain/toolkit/client";
import { utils, ethers } from "ethers";
import ERC20 from "@openzeppelin/contracts/build/contracts/ERC20.json";
import bech32 from "bech32";

const main = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const [signer] = await hre.ethers.getSigners();

  let recipient;
  try {
    if (bech32.decode(args.recipient)) {
      recipient = utils.solidityPack(
        ["bytes"],
        [utils.toUtf8Bytes(args.recipient)]
      );
    }
  } catch (e) {
    recipient = args.recipient;
  }

  let withdraw = true;
  if (args.withdraw != undefined) {
    withdraw = JSON.parse(args.withdraw);
  }

  const data = prepareData(
    args.contract,
    ["address", "bytes", "bool"],
    [args.targetToken, recipient, withdraw]
  );

  let tx;

  if (args.token) {
    const custodyAddress = getAddress("erc20Custody", hre.network.name as any);
    if (!custodyAddress) {
      throw new Error(
        `No ERC20 Custody contract found for ${hre.network.name} network`
      );
    }

    const custodyContract = new ethers.Contract(
      custodyAddress,
      ERC20Custody.abi,
      signer
    );
    const tokenContract = new ethers.Contract(args.token, ERC20.abi, signer);
    const decimals = await tokenContract.decimals();
    const value = parseUnits(args.amount, decimals);
    const approve = await tokenContract.approve(custodyAddress, value);
    await approve.wait();

    tx = await custodyContract.deposit(signer.address, args.token, value, data);
    tx.wait();
  } else {
    const value = parseUnits(args.amount, 18);
    const to = getAddress("tss", hre.network.name as any);
    tx = await signer.sendTransaction({ data, to, value });
  }

  if (args.json) {
    console.log(JSON.stringify(tx, null, 2));
  } else {
    console.log(`🔑 Using account: ${signer.address}\n`);

    console.log(`🚀 Successfully broadcasted a token transfer transaction on ${hre.network.name} network.
📝 Transaction hash: ${tx.hash}
  `);
  }
};

task("interact", "Interact with the contract", main)
  .addParam("contract", "The address of the withdraw contract on ZetaChain")
  .addParam("amount", "Amount of tokens to send")
  .addOptionalParam("token", "The address of the token to send")
  .addFlag("json", "Output in JSON")
  .addParam("targetToken")
  .addParam("recipient")
  .addOptionalParam("withdraw");
