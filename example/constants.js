const path = require('path');

const cwd = path.resolve(__dirname, "./");
const SVG_DIR = path.resolve(cwd, "svg");
const OUTPUT_DIR = path.resolve(cwd, "src");
const ASN_DIR = path.resolve(OUTPUT_DIR, "asn");
const ICONS_DIR = path.resolve(OUTPUT_DIR, "icons");

function resolve(...paths) {
  return path.resolve(OUTPUT_DIR, ...paths);
}

module.exports = {
  resolve,
  cwd,
  SVG_DIR,
  OUTPUT_DIR,
  ASN_DIR,
  ICONS_DIR,
};
