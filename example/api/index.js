const path = require("path");

const chalk = require('chalk');
const del = require("del");

const {
  generateAsnFiles,
  generateIconFiles,
  generatePreviewPage,
  copyFiles,
  generateEntry,
} = require("../../lib");

// const cwd = process.cwd();
const cwd = path.resolve(__dirname, '../');
const SVG_DIR = path.resolve(cwd, "svg");
const OUTPUT_DIR = path.resolve(cwd, "src");
const ASN_DIR = path.resolve(OUTPUT_DIR, "asn");
const ICONS_DIR = path.resolve(OUTPUT_DIR, "icons");

function resolve(...paths) {
  return path.resolve(OUTPUT_DIR, ...paths);
}

/**
 * 清除生成的文件
 */
function clean() {
  del([`${OUTPUT_DIR}/**/*`]);
}
module.exports.clean = clean;

async function generateAsn() {
  await generateAsnFiles({
    svg: SVG_DIR,
    output: OUTPUT_DIR,
  });
  generateEntry((filepath) => {
    const { name } = path.parse(filepath);
    return {
      identifier: name,
      path: `./asn/${name}`,
    };
  });
  copyFiles("types/**.ts", OUTPUT_DIR);
  console.log(chalk.green('success'), '生成 asn 文件成功');
}
module.exports.generateAsn = generateAsn;

async function generateIcons() {
  await generateIconFiles({
    iconsPath: "../asn",
  });
  copyFiles("components/**/*", resolve(OUTPUT_DIR, "components"));
  generateEntry((filepath) => {
    const { name } = path.parse(filepath);
    return {
      identifier: name,
      path: `./icons/${name}`,
    };
  });
  console.log(chalk.green('success'), '生成 icon 文件成功');
}
module.exports.generateIcons = generateIcons;

function generatePreview() {
  // generatePreviewPage({ icons: })
}

process.on('unhandledRejection', (err) => {
  console.log(chalk.redBright('error'), err.message);
});
