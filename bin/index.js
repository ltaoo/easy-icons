#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const del = require("del");
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");

const {
  default: transformer,
  createTsxFile,
  copyFiles,
  generateEntry,
} = require("../lib");

yargs(hideBin(process.argv))
  .command(
    "asn [svgDir]",
    "generate asn files",
    (yargs) => {
      yargs.positional("svgDir", {
        describe: "svg files dir",
      });
      yargs.option("output", {
        describe: "output",
      });
    },
    (argv) => {
      if (argv.verbose) console.info(`start generate asn files.`);
      const { svgDir, output } = argv;
      const cwd = process.cwd();
      const tmp = {
        svgDir: `${cwd}/${svgDir}`,
        output: `${cwd}/${output}`,
      };
      fs.writeFileSync(
        path.resolve(__dirname, "tmp.json"),
        JSON.stringify(tmp)
      );
      //   const { dir } = path.parse(output);
      generateAsn({ from: svgDir, to: `${output}/asn`, cwd: output });
    }
  )
  .command(
    "icons",
    "generate react icon components.",
    (yargs) => {
      yargs.option("output", {
        describe: "output",
      });
    },
    (argv) => {
      if (argv.verbose) console.info(`generate react icon components.`);
      const { output } = argv;
      // 先检查是否生成了 asn
      try {
        const cwd = process.cwd();
        console.log(path.resolve(cwd, output, "asn"));
        fs.statSync(path.resolve(cwd, output, "asn"));
        generateIcons({ from: output, to: `${output}/icons`, cwd: output });
      } catch (err) {
        throw new Error("请先执行 ei asn 生成 asn 文件");
      }
    }
  )
  .command(
    "clean",
    "clean generated files",
    (yargs) => {},
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

/**
 * 清除生成的文件
 */
function clean() {
  try {
    fs.statSync(path.resolve(__dirname, "tmp.json"));
    const { svgDir, output } = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, "tmp.json"), "utf-8")
    );
    console.log("clean files", output, svgDir);
    del([`${output}/**/*`, `!${svgDir}`], {
      force: true,
    });
    del(path.resolve(__dirname, "tmp.json"), {
      force: true,
    });
  } catch (err) {
    console.log("clean files fail", err);
    // ...
  }
}

module.exports.clean = clean;

async function generateAsn({ from, to, cwd }) {
  transformer({
    from,
    to,
    cwd,
    cb: (files) => {
      generateEntry(
        (file) => {
          const { name } = path.parse(file.path);
          return {
            identifier: name,
            path: `./asn/${name}`,
          };
        },
        cwd,
        files
      );
    },
  });
  copyFiles("types/**.ts", cwd);
}
module.exports.generateAsn = generateAsn;

function generateIcons({ from, to, cwd }) {
  createTsxFile({
    from: `${from}/asn`,
    to,
    iconsPath: "../asn",
  });
  copyFiles("components/**/*", path.resolve(cwd, "components"));
  generateEntry((filepath) => {
    const { name } = path.parse(filepath);
    return {
      identifier: name,
      path: `./icons/${name}`,
    };
  }, cwd);
}
module.exports.generateIcons = generateIcons;
