const fs = require("fs");
const path = require("path");

const del = require("del");

const { default: transformer, createTsxFile, copyFiles } = require("../lib");

// const cwd = process.cwd();
const cwd = path.resolve(__dirname);
const ROOT_DIR = path.resolve(cwd, "src");
const SVG_DIR = path.resolve(ROOT_DIR, "svg");
const ASN_DIR = path.resolve(ROOT_DIR, "asn");
const ICONS_DIR = path.resolve(ROOT_DIR, "icons");

/**
 * 清除生成的文件
 */
function clean() {
  del([`${ROOT_DIR}/**/*`, `!${SVG_DIR}`]);
}

module.exports.clean = clean;

function generateIcons() {
  transformer({ from: SVG_DIR, to: ASN_DIR, cwd });
  copyFiles('types/**.ts', ROOT_DIR);
}
module.exports.generateIcons = generateIcons;
// console.log(SVG_DIR, ASN_DIR);
// clean();
// createTsxFile({
//   from: path.resolve(__dirname, "src/asn"),
//   to: path.resolve(__dirname, "src/icons"),
//   iconsPath: '../asn',
// });

// console.log(path.parse('/Users/litao/Documents/nodejs/icons-svg/example/icons/asn'));
