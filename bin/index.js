#!/usr/bin/env node
const path = require('path');
const cp = require('child_process');

const open = require('open');
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");

const {
  clean,
  generateAsn,
  generateIcons,
  generatePreview,
  copyComponents,
} = require("./commands");

const cwd = process.cwd();
// console.log('[BIN]', cwd);

yargs(hideBin(process.argv))
  .command('create [filepath]', 'create project use template', (yargs) => {

  }, (argv) => {
    const { filepath } = argv;
    cp.execSync(`git clone https://github.com/ltaoo/e-icons-template.git ./${filepath}`);
  })
  // ------- create command start
  .command(
    "gen [type]",
    "generate asn or icons files",
    (yargs) => {
      yargs.positional("type", {
        describe: "asn or icons",
        choices: ['asn', 'icons', 'all'],
      });
      yargs.option("svg", {
        alias: 's',
        describe: "svg dir",
        required: true,
      });
      yargs.option("output", {
        alias: 'o',
        describe: "output dir",
        required: true,
      });
    },
    async (argv) => {
      if (argv.verbose) console.info(`start generate asn files.`);
      const { type, svg, output } = argv;
      // console.log('[BIN]Command create', type, svg, output);
      if (type === 'asn') {
        generateAsn({ svg, output });
        return;
      }
      if (type === 'icons') {
        generateIcons();
        return;
      }
      if (type === 'all') {
        await generateAsn({ svg, output });
        generateIcons();
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
        type: 'boolean',
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
        default: 'react',
      });
    },
    (argv) => {
      if (argv.verbose) console.info(`generate react icon components.`);
      const { type } = argv;
      copyComponents(type);
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
    (yargs) => { },
    (argv) => {
      if (argv.verbose) console.info(`clean generated files.`);
      clean();
    }
  )
  .option("verbose", {
    alias: "v",
    type: "boolean",
    description: "Run with verbose logging",
  }).argv;
