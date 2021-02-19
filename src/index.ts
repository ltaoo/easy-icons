import { fstat, mkdirSync, readFileSync, statSync, writeFileSync } from "fs";
import { resolve, parse, dirname } from "path";

import React from "react";
import ReactDOMServer from "react-dom/server";
import SVGO from "svgo";
import template from "lodash.template";
import upperFirst from "lodash.upperfirst";
import vfs from "vinyl-fs";
import through2 from "through2";
import globby from "globby";

import { getIdentifier, getNameAndThemeFromPath } from "./utils";
import { t } from "./plugins/svg2Definition";
import { generalConfig, remainFillConfig } from "./plugins/svgo/presets";
import {
  assignAttrsAtTag,
  adjustViewBox,
  setDefaultColorAtPathTag,
} from "./plugins/svg2Definition/transforms";
import { twotoneStringify } from "./plugins/svg2Definition/stringify";
import { ThemeType, ThemeTypeUpperCase } from "./types";

const cwd = process.cwd();
const THIS_ROOT_DIR = resolve(__dirname);
const TEMPLATES_DIR = resolve(THIS_ROOT_DIR, "./templates");
function r(...paths: string[]) {
  return resolve(THIS_ROOT_DIR, ...paths);
}
const asnTemplate = readFileSync(resolve(TEMPLATES_DIR, "asn.ts.ejs"), "utf8");
const iconTemplate = readFileSync(
  resolve(TEMPLATES_DIR, "icon.tsx.ejs"),
  "utf-8"
);
const previewTemplate = readFileSync(
  resolve(TEMPLATES_DIR, "index.html.ejs"),
  "utf-8"
);
const CACHE_DIR = ".cache";

const themes = ["filled", "outlined", "twotone"];

/**
 * svg 转 js 纯对象
 * @param {string} svg - svg 文件内容
 * @param {string} name - svg 文件名
 * @param {string} theme - svg 主题
 */
export async function svg2asn(svg: string, name: string, theme: ThemeType) {
  const optimizer =
    theme === "twotone" ? new SVGO(remainFillConfig) : new SVGO(generalConfig);
  const { data } = await optimizer.optimize(svg);
  if (theme === "twotone") {
    return t(data, {
      name: name,
      theme: theme,
      extraNodeTransformFactories: [
        assignAttrsAtTag("svg", { focusable: "false" }),
        adjustViewBox,
        setDefaultColorAtPathTag("#333"),
      ],
      stringify: twotoneStringify,
    });
  }
  return t(data, {
    name: name,
    theme: theme,
    extraNodeTransformFactories: [
      assignAttrsAtTag("svg", { focusable: "false" }),
      adjustViewBox,
    ],
    stringify: JSON.stringify,
  });
}
/**
 * 生成对应 asn 文件
 * @param {string} asn - svg2asn 转换得到的 asn
 * @param {boolean} [typescript=true] - 是否生成 ts 文件
 */
export function createAsnFile(
  asn: string,
  { name, theme }: { name: string; theme: ThemeType },
  typescript: boolean = true
) {
  try {
    // console.log("[CORE]createAsnFile", asn, typeof asn);
    const mapToInterpolate = ({
      name,
      content,
    }: {
      name: string;
      content: string;
    }) => {
      const identifier = getIdentifier({
        name: name,
        themeSuffix: theme
          ? (upperFirst(theme) as ThemeTypeUpperCase)
          : undefined,
      });
      return {
        identifier,
        content: content,
        typescript,
      };
    };
    const render = template(asnTemplate);
    return render(mapToInterpolate({ name: name, content: asn }));
  } catch (err) {
    // ...
    throw Promise.reject(err);
  }
}
const transformToAsn = () =>
  through2.obj(async (file, _, cb) => {
    if (file.isNull()) {
      return cb(null, file);
    }
    const filepath = file.path;
    const { name, theme } = getNameAndThemeFromPath(filepath);
    const content = file.contents.toString();
    const nextContent = await svg2asn(content, name, theme);
    file.contents = Buffer.from(nextContent);
    file.meta = {
      name: name,
      theme: theme,
    };
    return cb(null, file);
  });
const transformToIcon = ({ typescript }: { typescript?: boolean } = {}) =>
  through2.obj((file, _, cb) => {
    if (file.isNull()) {
      return cb(null, file);
    }
    var content = file.contents.toString();
    try {
      const nextContent = createAsnFile(
        content,
        file.meta,
        typescript
      ) as string;
      file.contents = Buffer.from(nextContent);
      return cb(null, file);
    } catch (err) {
      return cb(err, null);
    }
  });
const rename = ({ typescript }: { typescript?: boolean } = {}) =>
  through2.obj((file, _, cb) => {
    if (file.isNull()) {
      return cb(null, file);
    }
    const {
      path,
      meta: { name, theme },
    } = file;
    file.path = path.replace(`/${theme}`, "");
    file.basename = getIdentifier({ name: name, themeSuffix: theme });
    file.extname = ".ts";
    return cb(null, file);
  });

const SVG_FILES: any[] = [];
/**
 * 批量转换 svg 文件成 js/ts 文件
 * @param {string} svg - svg 文件夹
 * @param {string} output - 生成的 asn 文件保存的路径
 * @param {boolean} [typescript=true] - 生成的 asn 文件是否是 ts 文件
 * @param {() => void} [cb] - 处理完所有文件后的回调（此时文件并没有生成）
 */
export function generateAsnFiles({
  svg,
  output,
  typescript,
  before,
  done,
}: {
  svg: string;
  output: string;
  typescript?: boolean;
  before?: (files: any[]) => void;
  done?: () => void;
}) {
  return new Promise((res, reject) => {
    if (validateSvgDir(svg) === false) {
      reject(new Error(`${svg} is not existing.`));
    }
    updateCachedDir({
      svg,
      output,
    });
    const pattern = resolve(svg, "**", "*.svg");
    // before process svg files
    const svgFiles = globby.sync(pattern);
    if (before) {
      before(svgFiles);
    }
    updateCachedSvg({
      original: svgFiles,
    });
    // begin process svg files
    vfs
      .src(pattern)
      .pipe(transformToAsn())
      .pipe(transformToIcon({ typescript }))
      .pipe(rename({ typescript }))
      .pipe(vfs.dest(resolve(output, "asn")));
    // check has created asn file
    const asnPattern = resolve(output, "asn", "**", "*.ts");
    const timer = setInterval(() => {
      const asnFiles = globby.sync(asnPattern);
      // console.log('[]generateAsnFiles check has done', svgFiles.length, asnFiles.length);
      if (svgFiles.length === asnFiles.length) {
        clearInterval(timer);
        updateCachedSvg({
          asn: asnFiles,
        });
        if (done) {
          // after process svg files
          done();
        }
        res({
          svg: svgFiles,
          asn: asnFiles,
        });
      }
    }, 800);
  });
}

function checkHasAsnFiles() {
  try {
    statSync(DIR_JSON);
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * 判断一个路径是否是 npm 包名
 * @param filepath
 */
function checkIsNpmPackage(filepath: string) {
  const firstChar = filepath.charAt(0);
  const secondChar = filepath.charAt(1);
  if ([".", "/"].includes(firstChar)) {
    return false;
  }
  if (["@"].includes(firstChar) && ["/"].includes(secondChar)) {
    return false;
  }
  if (filepath.includes("/")) {
    return false;
  }
  return true;
}

function getAllAsn(asnPath: string): Promise<string[]> {
  return new Promise((res) => {
    if (checkIsNpmPackage(asnPath)) {
      import(asnPath).then((module) => {
        // console.log(module);
        const allAsn: string[] = Object.keys(module);
        res(allAsn);
      });
      return;
    }
    const allAsn: string[] = globby.sync([resolve(asnPath, "**.ts")]);
    res(allAsn.map((asnFilepath) => parse(asnFilepath).name));
  });
}
/**
 * 创建 icon 组件文件
 */
export function generateIconFiles({
  iconsPath, // iconsPath 就是 asnPath，两个其实是同一个东西
  output,
  asnPath,
}: {
  iconsPath: string;
  asnPath?: string;
  output?: string;
}) {
  return new Promise((res, reject) => {
    const outputDir = output || readCachedFile(DIR_JSON).output;
    const asnDir = asnPath || resolve(outputDir, "asn");
    let allAsn: string[] = [];
    if (!checkIsNpmPackage(asnDir)) {
      const pattern = resolve(asnDir, "**", "*.ts");
      vfs
        .src(pattern)
        .pipe(
          through2.obj((file, _, cb) => {
            if (file.isNull()) {
              return cb(null, file);
            }
            const { path } = file;
            const { name } = parse(path);
            allAsn.push(name);
            const render = template(iconTemplate);
            const nextContent = render({
              svgIdentifier: name,
              iconsPath,
            });
            file.contents = Buffer.from(nextContent);
            file.extname = ".tsx";
            cb(null, file);
          })
        )
        .pipe(vfs.dest(resolve(outputDir, "icons")));
      res(allAsn);
    }
    // monorepo 的场景，或者说 asn 干脆就是另一个包，和 icons 仅仅是依赖关系，这时需要 require asn
    import(asnDir).then((module) => {
      // console.log(module);
      allAsn = Object.keys(module);
      allAsn.forEach((svgIdentifier) => {
        const render = template(iconTemplate);
        const nextContent = render({
          svgIdentifier,
          iconsPath,
        });
        const iconFilepath = resolve(
          outputDir,
          "icons",
          `${svgIdentifier}.tsx`
        );
        ensure(dirname(iconFilepath));
        writeFileSync(iconFilepath, nextContent);
      });
      res(allAsn);
    });
  });
}

/**
 * 生成 src/index.ts 文件
 * @param param0
 */
export async function generateEntry({
  output,
  asnPath,
  render,
}: {
  output: string;
  asnPath: string;
  render: (svgIdentifier: string) => { identifier: string; path: string };
}) {
  if (asnPath === undefined) {
    return Promise.reject(new Error(`asnPath can't be undefined.`));
  }
  const filepath = resolve(output, "index.ts");
  if (checkIsNpmPackage(asnPath)) {
    return;
  }
  const allAsn = await getAllAsn(asnPath);
  const renderTemplate =
    "export { default as <%= identifier %> } from '<%= path %>';";
  const fileContent = allAsn
    .map((asn) => {
      const { identifier, path } = render(asn);
      const content = template(renderTemplate)({ identifier, path });
      return content;
    })
    .join("\n");

  ensure(dirname(filepath));
  writeFileSync(filepath, fileContent);
}

/**
 * 根据 icons 生成一个文件
 * 它会从 output/asn 下找到所有 ts 文件，并使用路径来渲染内容
 * @todo 它可以拆分成两个方法，一个单纯用来创建文件，一个用例读取 asn 后根据 asn 创建文件
 * @param {function} fn - 如何根据 filepath 生成 identifier 和 path，这两个值将被渲染到文件中
 * @param {string} output - 文件生成的路径
 * @param {any[]} opts.cachedFiles - 使用指定的文件进行生成，而不去查找 asn 目录下的所有 ts 文件
 * @param {string} opts.filename - 生成的文件名，如果传了该值，则可以自己指定生成的文件名，不自动生成为 output/index.ts
 * @param {string} opts.content - 生成的文件内容，如果传了该值，则可以不根据模板渲染，而是强制使用该值
 * @param {string} opts.templateContent - 渲染模板
 */
export function generateFile(
  fn: (filepath: string) => { identifier: string; path: string },
  {
    filepaths,
    filename,
    output,
    content: forceContent,
    template: t = "export { default as <%= identifier %> } from '<%= path %>';",
  }: {
    filepaths?: any[];
    content?: string;
    filename?: string;
    output?: string;
    template?: string;
  } = {}
) {
  return new Promise((res, reject) => {
    const { output } = readCachedFile(DIR_JSON);
    const files = filepaths || globby.sync(resolve(output, "asn", "*.ts"));
    // console.log('[]generateEntry - collected files', output, files);
    const content =
      forceContent ||
      files
        .map((filepath: any) => {
          const params = fn(filepath);
          if (params.identifier === undefined || params.path === undefined) {
            throw new Error("identifier or path can't be undefined");
          }
          return template(t)(params);
        })
        .join("\n");

    const name = filename || resolve(output, "index.ts");
    ensure(dirname(name));
    writeFileSync(name, content);
    res(name);
  });
}

function ensure(filepath: string, next: string[] = []) {
  try {
    statSync(filepath);
    if (next.length !== 0) {
      mkdirSync(next.pop() as string);
      ensure(filepath, next);
    }
  } catch {
    const needToCreate = dirname(filepath);
    ensure(needToCreate, next.concat(filepath));
  }
}

/**
 * 根据文件路径列表生成预览 html
 * @param {string[]} files - 文件路径列表
 */
function render(files: string[]) {
  return React.createElement(
    "ul",
    {
      key: 10,
      className: "anticons-list",
    },
    files.map((filepath) => {
      const Icon = require(resolve(cwd, filepath)).default;
      return React.createElement(
        "li",
        {
          key: filepath,
          className: "Outlined",
        },
        [
          React.createElement(Icon, { key: 1 }),
          React.createElement(
            "span",
            {
              key: 2,
              className: "anticon-class",
            },
            React.createElement(
              "span",
              { className: "ant-badge" },
              parse(filepath).name
            )
          ),
        ]
      );
    })
  );
}
/**
 * 根据文件路径中的主题分类
 * @param {string[]} files - 文件路径列表
 */
function sortByTheme(files: string[]) {
  return themes.map((theme) => {
    return {
      theme,
      icons: files.filter((filepath) => {
        if (filepath.includes(upperFirst(theme))) {
          return true;
        }
        return false;
      }),
    };
  });
}

/**
 * 生成预览 html 文件，只有单个文件
 * 该方法必须在 icons 被打包后调用，因为它不支持编译 ts 文件和 react 语法等
 * @param {string} icons - 打包得到的 icons 目录
 * @param {string} output - 输出路径
 */
export function generatePreviewPage({
  icons,
  output,
  name,
}: {
  icons: string;
  output: string;
  name: string;
}) {
  const files = globby.sync([`${icons}/*.js`, `!${icons}/index.js`]);

  let filename = name || "index.html";
  let outputPath = output;
  const { dir, ext, name: parsedName } = parse(output);
  if (ext !== "") {
    filename = parsedName;
    outputPath = dir;
  }
  // @todo 检查是否是正确的 icons 路径，看里面的文件命名是不是 outlined 或者 filled

  const themes = sortByTheme(files);
  const element = React.createElement(
    "div",
    { key: "div" },
    themes.map(({ theme, icons }) => {
      return React.createElement("div", { key: theme }, [
        React.createElement("h2", { key: "h2" }, upperFirst(theme)),
        render(icons),
      ]);
    })
  );
  const result = ReactDOMServer.renderToString(element);

  const f = resolve(cwd, outputPath, filename);
  ensure(dirname(f));
  writeFileSync(
    f,
    template(previewTemplate)({
      content: result,
    })
  );
  return f;
}

function validateSvgDir(svgDir: string) {
  try {
    statSync(svgDir);
    // 只要有 themes 其中一个即可
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * 将项目内的某些文件拷贝到指定目录
 * @param {string} patterns - 需要拷贝的文件，相对 lib/es 目录，不是 src 目录需要注意下
 * @param {string} to - 拷贝到的目录，相对于执行该命令的目录
 */
export function copyFiles(patterns: string, to: string) {
  vfs.src(`${r()}/${patterns}`).pipe(vfs.dest(to));
}

function updateCachedFile(
  filepath: string,
  nextContent: { [key: string]: any }
) {
  const prevContent = readCachedFile(filepath);
  ensure(dirname(filepath));
  writeFileSync(
    filepath,
    JSON.stringify({
      ...prevContent,
      ...nextContent,
    })
  );
}
function readCachedFile(filepath: string) {
  try {
    statSync(filepath);
    return JSON.parse(readFileSync(filepath, "utf-8"));
  } catch (err) {
    return {};
  }
}

const DIR_JSON = r(CACHE_DIR, "dir.json");
function updateCachedDir(nextDir: { svg?: string; output?: string } = {}) {
  updateCachedFile(DIR_JSON, nextDir);
}
const SVG_NAME_JSON = r(CACHE_DIR, "svg.json");
function updateCachedSvg(nextSvg: { original?: any; asn?: any } = {}) {
  updateCachedFile(SVG_NAME_JSON, nextSvg);
}

export function getOutput() {
  const { output } = readCachedFile(DIR_JSON);
  return output;
}
