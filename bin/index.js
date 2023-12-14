#! /usr/bin/env node
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const { Compile, Test } = require("../dist");
const path = require("path");

Error.stackTraceLimit = 100;

yargs(hideBin(process.argv))
  .command(
    "compile",
    "Compile the current project",
    (yargs) => {
      return yargs;
    },
    (argv) => {
      Compile(".", {
        debug: argv.debug,
        no_cache: argv["no-cache"],
        resources_path: path.resolve(__dirname, "../resources"),
      });
    }
  )
  .command(
    "test",
    "Compile the test code",
    (yargs) => {
      return yargs;
    },
    (argv) => {
      Test(".", {
        debug: true,
        no_cache: true,
        resources_path: path.resolve(__dirname, "../resources"),
      });
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
