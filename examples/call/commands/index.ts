#!/usr/bin/env npx tsx
import { Command } from "commander";

import { connected } from "./connected";
import { universal } from "./universal";
import { deploy } from "./deploy";
import { suiDepositAndCallCommand } from "./suiDepositAndCall";

const program = new Command()
  .helpCommand(false)
  .addCommand(deploy)
  .addCommand(connected)
  .addCommand(universal)
  .addCommand(suiDepositAndCallCommand);

if (require.main === module) program.parse();

export default program;
