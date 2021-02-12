const fs = require("fs");
const path = require("path");

const del = require("del");

const {
  default: transformer,
  createTsxFile,
  copyFiles,
  generateEntry,
} = require("../lib");

// const cwd = process.cwd();
const cwd = path.resolve(__dirname);
const ROOT_DIR = path.resolve(cwd, "src");
const SVG_DIR = path.resolve(ROOT_DIR, "svg");
const ASN_DIR = path.resolve(ROOT_DIR, "asn");
const ICONS_DIR = path.resolve(ROOT_DIR, "icons");

function resolve(...paths) {
  return path.resolve(ROOT_DIR, ...paths);
}

/**
 * 清除生成的文件
 */
function clean() {
  del([`${ROOT_DIR}/**/*`, `!${SVG_DIR}`]);
}

module.exports.clean = clean;

function generateAsn() {
  transformer({
    from: SVG_DIR,
    to: ASN_DIR,
    cwd,
    cb: (files) => {
      generateEntry((file) => {
        const { name } = path.parse(file.path);
        return {
          identifier: name,
          path: `./asn/${name}`,
        };
      }, ROOT_DIR, files);
    },
  });
  copyFiles("types/**.ts", ROOT_DIR);
}
module.exports.generateAsn = generateAsn;

function generateIcons() {
  createTsxFile({
    from: ASN_DIR,
    to: ICONS_DIR,
    iconsPath: "../asn",
  });
  copyFiles("components/**/*", resolve(ROOT_DIR, "components"));
  generateEntry((filepath) => {
    const { name } = path.parse(filepath);
    return {
      identifier: name,
      path: `./icons/${name}`,
    };
  }, ROOT_DIR);
}
module.exports.generateIcons = generateIcons;

console.log(
  path.parse("/Users/litao/Documents/nodejs/icons-svg/example/icons/asn")
);
