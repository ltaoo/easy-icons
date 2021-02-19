#!/usr/bin/env node
const path = require("path");
const cp = require("child_process");

const open = require("open");
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");

const {
  clean,
  generateAsn,
  generateIcons,
  generatePreview,
  copyComponents,
} = require("./commands");

// const cwd = process.cwd();
// console.log('[BIN]', cwd);

yargs(hideBin(process.argv))
  // ------- create command start
  .command(
    "gen [type]",
    "generate asn or icons files",
    (yargs) => {
      yargs.positional("type", {
        describe: "asn or icons",
        choices: ["asn", "icons", "all"],
      });
      yargs.option("svg", {
        alias: "s",
        describe: "svg dir",
      });
      yargs.option("output", {
        alias: "o",
        describe: "output dir",
      });
      yargs.option("asn-dir", {
        describe: "required asn module when generate icon",
        default: "../asn",
      });
    },
    async (argv) => {
      if (argv.verbose) console.info(`start generate asn files.`);
      const { type, svg, output, asnDir } = argv;
      if (type === "asn") {
        generateAsn({ svg, output });
        return;
      }
      const params = {
        asnPath: asnDir,
        output,
        iconsPath: `${asnDir}/lib`,
      };
      if (params.asnPath === undefined) {
        params.iconsPath = "../asn";
      }
      if (type === "icons") {
        generateIcons(params);
        return;
      }
      if (type === "all") {
        await generateAsn({ svg, output });
        generateIcons(params);
      }
    }
  )
  // ------- command start
  .command(
    "update",
    "add new svg icons",
    (yargs) => {
      yargs.option("preview", {
        describe: "only view icons that new",
        type: "boolean",
      });
    },
    (argv) => {
      if (argv.verbose) console.info(`generate react icon components.`);
      const { preview } = argv;
      if (preview === true) {
        //
      }
    }
  )
  // ------- copy command start
  .command(
    "copy",
    "copy components file",
    (yargs) => {
      yargs.option("type", {
        describe: "framework want to use.",
        default: "react",
      });
      yargs.option("output", {
        describe: "output dir.",
      });
    },
    (argv) => {
      if (argv.verbose) console.info(`generate react icon components.`);
      const { type, output } = argv;
      copyComponents(output);
    }
  )
  // ------- preview command start
  .command(
    "preview",
    "generate html page for preview",
    (yargs) => {
      yargs.options("icons", {
        describe: "bundled icons dir",
        required: true,
      });
      yargs.options("output", {
        describe: "the folder",
        required: true,
      });
    },
    (argv) => {
      if (argv.verbose) console.info(`clean generated files.`);
      const { icons, output } = argv;
      const page = generatePreview({ icons, output });

      open(`file://${path.resolve(page)}`);
    }
  )
  .command(
    "clean",
    "clean generated files",
    (yargs) => {
      yargs.positional("dir", {
        describe: "dir need to clean.",
      });
    },
    (argv) => {
      if (argv.verbose) console.info(`clean generated files.`);
      const { dir } = argv;
      clean(dir);
    }
  )
  .option("verbose", {
    alias: "v",
    type: "boolean",
    description: "Run with verbose logging",
  }).argv;
