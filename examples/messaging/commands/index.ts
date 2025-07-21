#!/usr/bin/env npx tsx

import { Command } from "commander";
import { deploy } from "./deploy";
import { connect } from "./connect";
import { message } from "./message";

const program = new Command()
  .addCommand(deploy)
  .addCommand(connect)
  .addCommand(message);

program.parse();
