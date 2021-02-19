const fs = require("fs");
const path = require("path");

const del = require("del");
const chalk = require("chalk");

const {
  generateAsnFiles,
  generateIconFiles,
  generatePreviewPage,
  copyFiles,
  generateEntry,
  getOutput,
} = require("../lib");
const { statSync } = require("fs");
/**
 * 清除生成的文件
 */
function clean() {
  const output = getOutput();
  if (output === undefined) {
    return;
  }
  del([`${output}/**/*`], {
    force: true,
  });
  console.log("clean success~");
}

module.exports.clean = clean;

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
  try {
    statSync(path.resolve(output, "components"));
  } catch (err) {
    // ...
    copyComponents();
  }
  console.log(chalk.green("success"), "生成 icon 文件成功");
  fs.writeFileSync(
    path.resolve(output, "index.ts"),
    `export * from './icons';`
  );
}
module.exports.generateIcons = generateIcons;

function copyComponents() {
  const output = getOutput();
  copyFiles("components/**/*", path.resolve(output, "components"));
  console.log(chalk.green("success"), "拷贝 components 文件成功");
}
module.exports.copyComponents = copyComponents;

/**
 * 根据 git 增量处理生成 icon
 */
function addIcons() {}

/**
 * 生成预览文件
 */
function generatePreview(opts) {
  return generatePreviewPage(opts);
}
module.exports.generatePreview = generatePreview;
