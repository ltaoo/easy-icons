/**
 * @file 输入 svg icon 目录，在指定目录输出 asn 文件
 */
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

import vfs from "vinyl-fs";
import through2 from "through2";
import globby from "globby";

import {
  getIdentifier,
  getNameAndThemeFromPath,
  existing,
  ensure,
} from "./utils";
import { svg2asn, createAsnFileContent, transformer } from "./core";

/**
 * 批量转换 svg 文件成 js/ts 文件
 * @param {string} svg - svg 文件夹
 * @param {string} output - 生成的 asn 文件保存的路径
 * @param {boolean} [typescript=true] - 生成的 asn 文件是否是 ts 文件
 * @param {() => void} [cb] - 处理完所有文件后的回调（此时文件并没有生成）
 */
export function generateAsnFilesFromSvgDir({
  entry,
  output,
  typescript,
  before,
  done,
  parser,
}: {
  entry: string;
  output: string;
  typescript?: boolean;
  parser?: (id: string) => { name: string; theme: string };
  before?: (files: any[]) => void;
  done?: () => void;
}) {
  return new Promise(async (res, reject) => {
    if (!existing(entry)) {
      reject(new Error(`${entry} is not existing.`));
      return;
    }
    const pattern = resolve(entry, "**", "*.svg");
    // before process svg files
    const svgFiles = globby.sync(pattern);
    if (before) {
      before(svgFiles);
    }
    const asnOutput = resolve(output, "asn");
    ensure(asnOutput);

    // begin process svg files
    for (let i = 0; i < svgFiles.length; i += 1) {
      const svgFile = svgFiles[i];
      const svgContent = readFileSync(svgFile, "utf-8");
      const asnFile = await transformer(svgContent, svgFile, {
        typescript,
      });

      console.log("Prepare generate file", asnFile.id);
      writeFileSync(asnFile.id, asnFile.content);
    }

    res(svgFiles);
  });
}
/**
 * vfs 处理器，接收 svg 文件内容转换成 asn 内容
 */
function toAsn() {
  return through2.obj(async (file, _, cb) => {
    if (file.isNull()) {
      return cb(null, file);
    }
    const filepath = file.path;
    const { name, theme } = getNameAndThemeFromPath(filepath);
    const content = file.contents.toString();
    const nextContent = await svg2asn(content, name, theme);
    file.contents = Buffer.from(nextContent);
    file.meta = {
      name,
      theme,
    };
    return cb(null, file);
  });
}
/**
 * vfs 处理器，接收 asn 内容转换成 asn 文件内容
 */
function toAsnFile({ typescript }: { typescript?: boolean } = {}) {
  return through2.obj((file, _, cb) => {
    if (file.isNull()) {
      return cb(null, file);
    }
    var content = file.contents.toString();
    try {
      const nextContent = createAsnFileContent(
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
}
/**
 * vfs 处理器，asn 文件重命名
 */
function rename({ typescript }: { typescript?: boolean } = {}) {
  return through2.obj((file, _, cb) => {
    if (file.isNull()) {
      return cb(null, file);
    }
    const {
      path,
      meta: { name, theme },
    } = file;
    file.path = path.replace(`/${theme}`, "");
    file.basename = getIdentifier({ name: name, themeSuffix: theme });
    file.extname = typescript ? ".ts" : ".js";
    return cb(null, file);
  });
}
