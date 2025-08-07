#!/usr/bin/env npx tsx

import { Command } from "commander";
import { deploy } from "./deploy";

const program = new Command().addCommand(deploy);

program.parse();
