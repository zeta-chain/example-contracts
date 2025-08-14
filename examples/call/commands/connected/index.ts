import { Command } from "commander";

import { callCommand } from "./call";
import { depositCommand } from "./deposit";
import { depositAndCallCommand } from "./depositAndCall";

export const connected = new Command("connected")
  .addCommand(callCommand)
  .addCommand(depositCommand)
  .addCommand(depositAndCallCommand);
