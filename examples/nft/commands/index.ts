#!/usr/bin/env npx tsx

import { Command } from "commander";
import {
  deploy,
  mint,
  transfer,
  transferAndCall,
} from "@zetachain/standard-contracts/nft/commands";

const program = new Command()
  .addCommand(deploy)
  .addCommand(mint)
  .addCommand(transfer)
  .addCommand(transferAndCall);

program.parse();
