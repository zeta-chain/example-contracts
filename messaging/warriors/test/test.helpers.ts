import { MaxUint256 } from "@ethersproject/constants";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ZetaTokenConsumerUniV3__factory } from "@zetachain/protocol-contracts/dist/typechain-types";
import { BigNumber, ContractReceipt } from "ethers";
import {
  ERC20__factory,
  UniswapV2Router02__factory,
} from "toolkit/typechain-types";

import { getAddress } from "./address.helpers";
import { getNow } from "./deploy.helpers";

export const getMintTokenId = (mintTx: ContractReceipt) =>
  mintTx.events?.[0].args?.tokenId;

export const parseInteractorLog = (logs: ContractReceipt["logs"]) => {
  const iface = ZetaTokenConsumerUniV3__factory.createInterface();

  const eventNames = logs.map((log) => {
    try {
      const parsedLog = iface.parseLog(log);

      return parsedLog.name;
    } catch (e) {
      return "NO_ZETA_LOG";
    }
  });

  return eventNames;
};

export const addZetaEthLiquidityTest = async (
  zetaTokenAddress: string,
  zetaToAdd: BigNumber,
  ETHToAdd: BigNumber,
  deployer: SignerWithAddress
) => {
  const uniswapRouterAddr = getAddress("uniswapV2Router02", {
    customNetworkName: "eth-mainnet",
    customZetaNetwork: "mainnet",
  });
  const uniswapRouter = UniswapV2Router02__factory.connect(
    uniswapRouterAddr,
    deployer
  );

  const ZetaTokenContract = ERC20__factory.connect(zetaTokenAddress, deployer);

  const tx1 = await ZetaTokenContract.approve(
    uniswapRouter.address,
    MaxUint256
  );
  await tx1.wait();

  const tx2 = await uniswapRouter.addLiquidityETH(
    ZetaTokenContract.address,
    zetaToAdd,
    0,
    0,
    deployer.address,
    (await getNow()) + 360,
    { gasLimit: 10_000_000, value: ETHToAdd }
  );
  await tx2.wait();
};
