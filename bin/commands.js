const fs = require("fs");
const path = require("path");

const del = require("del");
const chalk = require("chalk");

const {
  generateAsnFiles,
  generateIconFiles,
  copyFiles,
  generateEntry,
} = require("../lib");
const { statSync } = require("fs");
/**
 * 清除生成的文件
 */
function clean(paths) {
  if (output === undefined) {
    return;
  }
  del(paths, {
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

/**
 * 根据 git 增量处理生成 icon
 */
function addIcons() {}
