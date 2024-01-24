import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const main = async (args: any, hre: HardhatRuntimeEnvironment) => {
  console.log(
    `This feature is no longer used, please check for more information: https://github.com/zeta-chain/example-contracts/issues/101`
  );
};

task("destination", "", main).addParam("contract").addParam("destination");
