import { mkdirSync, readFileSync, statSync, writeFileSync } from "fs";
import { resolve, parse, basename, dirname } from "path";
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

const SVG_FILES: any[] = [];
/**
 * 批量转换文件
 */
export default function generateAsn({
  from,
  to,
  cb,
}: {
  from: string;
  to: string;
  cb?: (files: any[]) => void;
}) {
  let count = 0;
  const pattern = `${from}/**/*.svg`;
  vfs
    .src(pattern)
    .pipe(
      through2.obj((file, _, callback) => {
        count += 1;
        callback(null, file);
      })
    )
    .pipe(one)
    .pipe(two)
    .pipe(rename)
    .pipe(
      through2.obj((file, _, callback) => {
        SVG_FILES.push(file);
        callback(null, file);
        if (SVG_FILES.length === count && cb) {
          cb(SVG_FILES);
        }
      })
    )
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
  const pattern = `${from}/**/*.ts`;
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
            "/<%= svgIdentifier %>';\nimport AntdIcon, { AntdIconProps } from '../components/AntdIcon';\n\nconst <%= svgIdentifier %> = (\n  props: AntdIconProps,\n  ref: React.ForwardedRef<HTMLSpanElement>,\n) => <AntdIcon {...props} ref={ref} icon={<%= svgIdentifier %>Svg} />;\n\n<%= svgIdentifier %>.displayName = '<%= svgIdentifier %>';\nexport default React.forwardRef<HTMLSpanElement, AntdIconProps>(<%= svgIdentifier %>);\n"
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

export function generateEntry(
  fn: (filepath: string) => { identifier: string; path: string },
  output: string,
  {
    cachedFiles,
    filename = `${output}/index.ts`,
    content: forceContent,
    templateContent = "export { default as <%= identifier %> } from '<%= path %>';",
  }: {
    cachedFiles?: any[];
    content?: string;
    filename?: string;
    templateContent?: string;
  } = {}
) {
  // 生成入口文件
  const entryFileTemplate = templateContent;
  const files = cachedFiles || globby.sync("asn/*.ts", { cwd: output });
  const content =
    forceContent ||
    files
      .map((filepath: any) => {
        const params = fn(filepath);
        if (params.identifier === undefined || params.path === undefined) {
          throw new Error("identifier or path can't be undefined");
        }
        return template(entryFileTemplate)(params);
      })
      .join("\n");
  try {
    statSync(dirname(filename));
  } catch {
    mkdirSync(dirname(filename));
  }
  writeFileSync(filename, content);
}
