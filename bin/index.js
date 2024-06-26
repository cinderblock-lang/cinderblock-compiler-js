#! /usr/bin/env node
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const { Compile, CompileWorkspace } = require("../dist");

Error.stackTraceLimit = 100;

yargs(hideBin(process.argv))
  .command(
    "compile",
    "Compile the current project",
    (yargs) => {
      return yargs;
    },
    (argv) => {
      Compile(".", { debug: argv.debug, no_cache: argv["no-cache"] });
    }
  )
  .command(
    "workspace compile",
    "Compile the current workspace",
    (yargs) => {
      return yargs;
    },
    (argv) => {
      CompileWorkspace(".", { debug: argv.debug, no_cache: argv["no-cache"] });
    }
  )
  .option("debug", {
    alias: "d",
    type: "boolean",
  })
  .option("no-cache", {
    alias: "c",
    type: "boolean",
  })
  .parse();
