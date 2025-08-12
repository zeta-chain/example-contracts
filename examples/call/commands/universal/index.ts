import { Command } from "commander";

import { callCommand } from "./call";
import { withdrawCommand } from "./withdraw";
import { withdrawAndCallCommand } from "./withdrawAndCall";

export const universal = new Command("universal")
  .addCommand(callCommand)
  .addCommand(withdrawCommand)
  .addCommand(withdrawAndCallCommand);
