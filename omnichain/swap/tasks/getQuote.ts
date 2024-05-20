import { parseUnits } from "@ethersproject/units";
import { getAddress } from "@zetachain/protocol-contracts";
import { ZetaChainClient } from "@zetachain/toolkit/client";
import { utils, ethers } from "ethers";
import UniswapV2RouterABI from "@uniswap/v2-periphery/build/IUniswapV2Router02.json";
import ZRC20 from "@zetachain/protocol-contracts/abi/zevm/ZRC20.sol/ZRC20.json";

const getAmounts = async (
  direction: "in" | "out",
  provider: any,
  amount: any,
  tokenA: string,
  tokenB: string
) => {
  const uniswapV2Router02 = getAddress("uniswapV2Router02", "zeta_testnet");
  if (!uniswapV2Router02) {
    throw new Error("Cannot get uniswapV2Router02 address");
  }

  const uniswapRouter = new ethers.Contract(
    uniswapV2Router02,
    UniswapV2RouterABI.abi,
    provider
  );

  const path = [tokenA, tokenB];

  const amounts =
    direction === "in"
      ? await uniswapRouter.getAmountsIn(amount, path)
      : await uniswapRouter.getAmountsOut(amount, path);
  return amounts;
};

export const getQuote = async (
  amount: string,
  erc20: any,
  targetToken: string,
  network: string
) => {
  const client = new ZetaChainClient({ network: "testnet" });

  const amountIn = parseUnits(amount, 18).toString();

  const zetaTokenAddress = getAddress("zetaToken", "zeta_testnet");
  if (!zetaTokenAddress) {
    throw new Error("Cannot get ZETA token address");
  }

  const foreignCoins = await client.getForeignCoins();

  const chainID = await client.getChainId(network)?.toString();

  const inputZRC20 = foreignCoins.find((t: any) => {
    return erc20
      ? t.asset === erc20
      : t.foreign_chain_id === chainID && t.coin_type === "Gas";
  })?.zrc20_contract_address;

  const rpc = client.getEndpoint("evm", "zeta_testnet");
  const provider = new ethers.providers.JsonRpcProvider(rpc);

  const zrc20Contract = new ethers.Contract(targetToken, ZRC20.abi, provider);
  const [gasZRC20, gasFee] = await zrc20Contract.withdrawGasFee();

  const withdrawFeeInZETA = await getAmounts(
    "in",
    provider,
    gasFee,
    zetaTokenAddress,
    gasZRC20
  );

  const withdrawFeeInInputToken = await getAmounts(
    "in",
    provider,
    withdrawFeeInZETA[0],
    inputZRC20,
    zetaTokenAddress
  );

  if (utils.parseEther(amount).lte(withdrawFeeInInputToken[0])) {
    throw new Error(
      "Input amount is not enough to cover withdraw fee to the destination chain"
    );
  }

  let outputAmountInZETA;
  let outputAmount;

  try {
    outputAmountInZETA = await getAmounts(
      "out",
      provider,
      amountIn,
      inputZRC20,
      zetaTokenAddress
    );

    outputAmount = await getAmounts(
      "out",
      provider,
      outputAmountInZETA[1],
      zetaTokenAddress,
      targetToken
    );
  } catch (e: any) {
    throw new Error(e.reason);
  }

  return utils.formatEther(outputAmount[1]);
};
