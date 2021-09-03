const path = require("path");

const rimraf = require("rimraf");

const ROOT_DIR = __dirname;
function resolve(...paths) {
  return path.resolve(ROOT_DIR, ...paths);
}
// console.log("[clean]...", resolve("../lib"), resolve("../es"));
// rimraf([resolve("../lib"), resolve("../es")]);
