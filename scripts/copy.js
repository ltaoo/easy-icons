const path = require("path");

const vfs = require("vinyl-fs");

const ROOT_DIR = __dirname;
function resolve(...paths) {
  return path.resolve(ROOT_DIR, ...paths);
}

// vfs
//   .src(resolve("../templates") + "/**/*.ts")
//   .pipe(vfs.dest(resolve("../lib/templates")));

// 拷贝两个声明文件需要复用
vfs
  .src([resolve("../src/types.ts"), resolve("../src/helpers.ts")])
  .pipe(vfs.dest(resolve("../lib/types")));

// 拷贝组件
