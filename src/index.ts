import { readFileSync, writeFileSync } from "fs";
import { resolve, parse, basename } from "path";
import SVGO from "svgo";
import template from "lodash.template";
import upperfirst from "lodash.upperfirst";
import vfs from "vinyl-fs";
import through2 from "through2";
import globby from "globby";

import { getIdentifier } from "./utils";
import { t } from "./plugins/svg2Definition";
import { generalConfig } from "./plugins/svgo/presets";
import {
  assignAttrsAtTag,
  adjustViewBox,
} from "./plugins/svg2Definition/transforms";
import { ThemeType, ThemeTypeUpperCase } from "./types";

const THIS_ROOT_DIR = resolve(__dirname);
const TEMPLATES_DIR = resolve(THIS_ROOT_DIR, "../templates");
function r(...paths: string[]) {
  return resolve(THIS_ROOT_DIR, ...paths);
}

/**
 * svg 转 js 纯对象
 */
export async function svg2asn(string: string, name: string, theme: string) {
  const optimizer = new SVGO(generalConfig);
  const { data } = await optimizer.optimize(string);
  const asn = t(data, {
    name: name,
    theme: theme,
    extraNodeTransformFactories: [
      assignAttrsAtTag("svg", { focusable: "false" }),
      adjustViewBox,
    ],
    stringify: JSON.stringify,
  });
  return asn;
}
const iconTsFileTemplate = readFileSync(
  resolve(TEMPLATES_DIR, "icon.ts.ejs"),
  "utf8"
);
/**
 * asn 渲染成 ts 文件内容
 */
export function asn2ts(asn: string) {
  const { name, theme } = JSON.parse(asn);
  const mapToInterpolate = function({
    name,
    content,
  }: {
    name: string;
    content: string;
  }) {
    return {
      identifier: getIdentifier({
        name: name,
        themeSuffix: theme
          ? (upperfirst(theme) as ThemeTypeUpperCase)
          : undefined,
      }),
      content: content,
    };
  };
  var executor = template(iconTsFileTemplate);
  return executor(mapToInterpolate({ name: name, content: asn }));
}

function getNameAndThemeFromPath(filepath: string) {
  const { name, dir } = parse(filepath);
  const theme = basename(dir);
  return {
    name: name,
    theme: theme,
  };
}
const one = through2.obj(async (file, _, cb) => {
  if (file.isNull()) {
    return cb(null, file);
  }
  const filepath = file.path;
  const { name, theme } = getNameAndThemeFromPath(filepath);
  const content = file.contents.toString();
  const nextContent = await svg2asn(content, name, theme);
  file.contents = Buffer.from(nextContent as string);
  file.meta = {
    name: name,
    theme: theme,
  };
  return cb(null, file);
});

const two = through2.obj((file, _, cb) => {
  if (file.isNull()) {
    return cb(null, file);
  }
  var content = file.contents.toString();
  var nextContent = asn2ts(content) as string;
  file.contents = Buffer.from(nextContent);
  return cb(null, file);
});
const rename = through2.obj((file, _, cb) => {
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
/**
 * 批量转换文件
 */
export default function generateAsn({
  from,
  to,
}: {
  from: string;
  to: string;
}) {
  // 编译 svg 文件
  var pattern = `${from}/**/*.svg`;
  vfs
    .src(pattern)
    .pipe(one)
    .pipe(two)
    .pipe(rename)
    .pipe(vfs.dest(to));
}
export function copyFiles(patterns: string, to: string) {
  vfs.src(`${r()}/${patterns}`).pipe(vfs.dest(to));
}
/**
 * 创建 tsx 文件供引用
 */
export function createTsxFile({
  from,
  to,
  iconsPath,
}: {
  from: string;
  to: string;
  iconsPath: string;
}) {
  const pattern = from + "/**/*.ts";
  vfs
    .src(pattern)
    .pipe(
      through2.obj(function(file, _, cb) {
        if (file.isNull()) {
          return cb(null, file);
        }
        var path = file.path;
        var name = parse(path).name;
        var render = template(
          (
            "\n// GENERATE BY ./scripts/generate.ts\n// DON NOT EDIT IT MANUALLY\n\nimport * as React from 'react'\nimport <%= svgIdentifier %>Svg from '" +
            iconsPath +
            "/<%= svgIdentifier %>';\nimport AntdIcon, { AntdIconProps } from '../components/AntdIcon';\n\nconst <%= svgIdentifier %> = (\n  props: AntdIconProps,\n  ref: React.MutableRefObject<HTMLSpanElement>,\n) => <AntdIcon {...props} ref={ref} icon={<%= svgIdentifier %>Svg} />;\n\n<%= svgIdentifier %>.displayName = '<%= svgIdentifier %>';\nexport default React.forwardRef<HTMLSpanElement, AntdIconProps>(<%= svgIdentifier %>);\n"
          ).trim()
        );
        file.contents = Buffer.from(
          render({
            svgIdentifier: name,
          })
        );
        file.extname = ".tsx";
        cb(null, file);
      })
    )
    // .pipe(two)
    // .pipe(rename)
    .pipe(vfs.dest(to));
}

function generateEntry(output: string) {
  // 生成入口文件
  const entryFileTemplate =
    "export { default as <%= identifier %> } from '<%= path %>';";
  const files = globby
    .sync("asn/*.ts", { cwd: output })
    .map(function(filepath) {
      const { name } = parse(filepath);
      const identifier = getIdentifier({ name: name });
      const path = `./asn/${identifier}`;
      return template(entryFileTemplate)({
        identifier: identifier,
        path: path,
      });
    })
    .join("\n");
  writeFileSync(`${output}/index.ts`, files);
  // 拷贝 d.ts 文件
  vfs.src(`${resolve(__dirname, "templates")}/*.ts`).pipe(vfs.dest(output));
}
/**
 *
 */
// function walk<T>(fn: (iconDef: IconDefinitionWithIdentifier) => Promise<T>) {
//   return Promise.all(
//     Object.keys(allIconDefs).map((svgIdentifier) => {
//       const iconDef = (allIconDefs as { [id: string]: IconDefinition })[
//         svgIdentifier
//       ];
//       return fn({ svgIdentifier, ...iconDef });
//     })
//   );
// }
// async function generateIcons() {
//   const iconsDir = join(__dirname, "../src/icons");
//   try {
//     await promisify(access)(iconsDir);
//   } catch (err) {
//     await promisify(mkdir)(iconsDir);
//   }
//   const iconSource = "@cf2e/icons-svg/es";
//   const render = template(
//     `
// // GENERATE BY ./scripts/generate.ts
// // DON NOT EDIT IT MANUALLY
// import * as React from 'react'
// import <%= svgIdentifier %>Svg from '${iconSource}/asn/<%= svgIdentifier %>';
// import AntdIcon, { AntdIconProps } from '../components/AntdIcon';
// const <%= svgIdentifier %> = (
//   props: AntdIconProps,
//   ref: React.MutableRefObject<HTMLSpanElement>,
// ) => <AntdIcon {...props} ref={ref} icon={<%= svgIdentifier %>Svg} />;
// <%= svgIdentifier %>.displayName = '<%= svgIdentifier %>';
// export default React.forwardRef<HTMLSpanElement, AntdIconProps>(<%= svgIdentifier %>);
// `.trim()
//   );
//   await walk(async ({ svgIdentifier }) => {
//     // generate icon file
//     writeFileSync(
//       resolve(__dirname, `../src/icons/${svgIdentifier}.tsx`),
//       render({ svgIdentifier })
//     );
//   });
//   // generate icon index
//   const entryText = Object.keys(allIconDefs)
//     .sort()
//     .map(
//       (svgIdentifier) =>
//         `export { default as ${svgIdentifier} } from './${svgIdentifier}';`
//     )
//     .join("\n");
//   await promisify(appendFile)(
//     resolve(__dirname, "../src/icons/index.tsx"),
//     `
// // GENERATE BY ./scripts/generate.ts
// // DON NOT EDIT IT MANUALLY
// ${entryText}
//     `.trim()
//   );
// }
// async function generateEntries() {
//   const render = template(
//     `
// 'use strict';
//   Object.defineProperty(exports, "__esModule", {
//     value: true
//   });
//   exports.default = void 0;
//   var _<%= svgIdentifier %> = _interopRequireDefault(require('./lib/icons/<%= svgIdentifier %>'));
//   function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }
//   var _default = _<%= svgIdentifier %>;
//   exports.default = _default;
//   module.exports = _default;
// `.trim()
//   );
//   await walk(async ({ svgIdentifier }) => {
//     // generate `Icon.js` in root folder
//     await writeFile(
//       path.resolve(__dirname, `../${svgIdentifier}.js`),
//       render({
//         svgIdentifier,
//       })
//     );
//     // generate `Icon.d.ts` in root folder
//     await writeFile(
//       path.resolve(__dirname, `../${svgIdentifier}.d.ts`),
//       `export { default } from './lib/icons/${svgIdentifier}';`
//     );
//   });
// }
