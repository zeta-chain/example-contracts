#!/usr/bin/env npx tsx
import { Command } from "commander";

import { connected } from "./connected";
import { universal } from "./universal";

const program = new Command()
  .helpCommand(false)
  .addCommand(connected)
  .addCommand(universal);

if (require.main === module) program.parse();

export default program;
