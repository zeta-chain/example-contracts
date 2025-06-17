#!/usr/bin/env npx tsx
import { Command } from "commander";

import { connectedCallCommand } from "./connected/call";
import { connectedDepositCommand } from "./connected/deposit";
import { connectedDepositAndCallCommand } from "./connected/depositAndCall";
import { universalCallCommand } from "./universal/call";
import { universalWithdrawCommand } from "./universal/withdraw";

const program = new Command()
  .helpCommand(false)
  .addCommand(connectedCallCommand)
  .addCommand(connectedDepositCommand)
  .addCommand(connectedDepositAndCallCommand)
  .addCommand(universalCallCommand)
  .addCommand(universalWithdrawCommand);

if (require.main === module) program.parse();

export default program;
