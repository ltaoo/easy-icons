/**
 * 将 react ts component 转换成 js 文件
 * 大部分情况不用执行，除非 react component 有改动
 */
const path = require("path");
const fs = require("fs");

const rimraf = require("rimraf");
const babel = require("@babel/core");

const TEMPLATE_DIR = path.resolve(__dirname, "../templates");
const REACT_ICON_COMPONENTS = path.resolve(
  TEMPLATE_DIR,
  "./react-ts/components"
);
const REACT_JS_ICON_COMPONENTS = path.resolve(
  TEMPLATE_DIR,
  "./react-js/components"
);

const components = fs.readdirSync(REACT_ICON_COMPONENTS).map((filename) => {
  return {
    name: filename,
    filepath: path.resolve(REACT_ICON_COMPONENTS, filename),
  };
});

for (let i = 0; i < components.length; i += 1) {
  const { filepath, name } = components[i];
  const res = babel.transformFileSync(filepath, {
    filename: filepath,
    presets: ["@babel/preset-typescript"],
  });

  fs.writeFileSync(
    path.resolve(REACT_JS_ICON_COMPONENTS, name.replace("ts", "js")),
    res.code
  );
}
