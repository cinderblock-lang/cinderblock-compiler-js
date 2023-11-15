#! /usr/bin/env node
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const { Compile } = require("../dist");

yargs(hideBin(process.argv))
  .command(
    "compile",
    "Compile the current project",
    (yargs) => {
      return yargs;
    },
    (argv) => {
      Compile(".");
    }
  )
  .parse();
