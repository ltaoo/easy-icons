#!/usr/bin/env node
// @ts-nocheck
import path from "path";
import fs from "fs";

import del from "del";
import chalk from "chalk";
import cp from "child_process";

import yargs from "yargs";
import { hideBin } from "yargs/helpers";

// import { clean, generateAsn, generateIcons, copyComponents } from "./commands";

/**
 * 清除生成的文件
 */
function clean(paths: string[], output?: string) {
  if (output === undefined) {
    return;
  }
  del(paths, {
    force: true,
  });
  console.log("clean success~");
}

async function generateAsn({ svg, output }) {
  // console.log('[BIN]generateAsn - start', svg, output);
  await generateAsnFiles({
    svg,
    output,
  });
  generateEntry({
    render: (filepath) => {
      const { name } = path.parse(filepath);
      return {
        identifier: name,
        path: `./asn/${name}`,
      };
    },
    output,
    asnPath: path.resolve(output, "asn"),
  });
  copyFiles("types/**.ts", output);
  console.log(chalk.green("success"), "生成 asn 文件成功");
}
module.exports.generateAsn = generateAsn;

async function generateIcons({ iconsPath, asnPath, output }) {
  await generateIconFiles({
    iconsPath,
    asnPath,
    output,
  });
  generateEntry({
    render: (name) => {
      return {
        identifier: name,
        path: `./${name}`,
      };
    },
    filepath: path.resolve(output, "icons", "./index.ts"),
    output,
    asnPath,
  });
  copyFiles("types/**.ts", output);
  try {
    statSync(path.resolve(output, "components"));
  } catch (err) {
    // ...
    copyComponents(output);
  }
  console.log(chalk.green("success"), "生成 icon 文件成功");
  fs.writeFileSync(
    path.resolve(output, "index.ts"),
    `export * from './icons';`
  );
}
module.exports.generateIcons = generateIcons;

function copyComponents(output) {
  copyFiles("components/**/*", path.resolve(output, "components"));
  console.log(chalk.green("success"), "拷贝 components 文件成功");
}
module.exports.copyComponents = copyComponents;

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
        iconsPath: `${asnDir}/lib/asn`,
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
