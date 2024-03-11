import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { parseEther, parseUnits } from "@ethersproject/units";
import { getAddress } from "@zetachain/protocol-contracts";
import { prepareData } from "@zetachain/toolkit/helpers";
import { utils, ethers } from "ethers";
import ERC20Custody from "@zetachain/protocol-contracts/abi/evm/ERC20Custody.sol/ERC20Custody.json";
import ERC20 from "@openzeppelin/contracts/build/contracts/ERC20.json";

const main = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const [signer] = await hre.ethers.getSigners();

  const destinationTokens = args.targetToken.split(",");

  let bitcoinAddress = "";
  let data;
  if (args.btcRecipient) {
    bitcoinAddress = args.btcRecipient;
  }

  const bitcoinAddressBytes = utils.solidityPack(
    ["bytes"],
    [utils.toUtf8Bytes(bitcoinAddress)]
  );

  const tokensBytes = ethers.utils.concat(
    destinationTokens.map(
      address => utils.defaultAbiCoder.encode(['address'], [address])
      ));

  data = prepareData(
    args.contract,
    ["address", "bytes", "bytes"],
    [args.recipient, bitcoinAddressBytes, tokensBytes]
  );

  let tx;

  if (args.token) {
    const custodyAddress = getAddress("erc20Custody", hre.network.name as any);
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
    const to = getAddress("tss", hre.network.name);
    const value = parseEther(args.amount);
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
  .addOptionalParam("token", "The address of the token to send")
  .addParam("amount", "Amount of tokens to send")
  .addFlag("json", "Output in JSON")
  .addParam("recipient", "The evm address to send to")
  .addOptionalParam("btcRecipient", "The bitcoin address to send to")
  .addParam("targetToken", "The Address of the token to send to");
