/**
 * @file 复制模板文件到打包目录中
 */
const path = require("path");

const cpy = require("cpy");

const ROOT_DIR = __dirname;
function resolve(...paths) {
  return path.resolve(ROOT_DIR, ...paths);
}

async function main() {
  await cpy("templates/react-ts/components/**", "lib", {
    rename: (basename) => `templates/react-ts/components/${basename}`,
  });
  await cpy("templates/react-js/components/**", "lib", {
    rename: (basename) => `templates/react-js/components/${basename}`,
  });
  await cpy("templates/react-ts/components/**", "es", {
    rename: (basename) => `templates/react-ts/components/${basename}`,
  });
  await cpy("templates/react-js/components/**", "es", {
    rename: (basename) => `templates/react-js/components/${basename}`,
  });

  await cpy("src/types.ts", "lib");
  await cpy("src/types.ts", "es");
}

main();
