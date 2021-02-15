const path = require("path");

const vfs = require("vinyl-fs");

const ROOT_DIR = __dirname;
function resolve(...paths) {
  return path.resolve(ROOT_DIR, ...paths);
}


// 拷贝模板文件
vfs
  .src([resolve("../templates/*.ejs")])
  .pipe(vfs.dest(resolve("../lib/templates")));

// 拷贝 react 组件
vfs
  .src([resolve("../templates/components/*")])
  .pipe(vfs.dest(resolve("../lib/components")));

// 拷贝两个声明文件需要复用
vfs
  .src([resolve("../src/types.ts"), resolve("../src/helpers.ts")])
  .pipe(vfs.dest(resolve("../lib/types")));
