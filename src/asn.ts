/**
 * @file 输入 svg icon 目录，在指定目录输出 asn 文件
 */
import { readFileSync, writeFileSync } from "fs";
import { resolve, parse } from "path";

import globby from "globby";

import {
  existing,
  ensure,
  getNameAndThemeFromPath,
  getIdentifier,
} from "./utils";
import { entryRenderer, transformer, generateTypeFiles } from "./core";
import upperFirst from "lodash.upperfirst";

/**
 * 批量转换 svg 文件成 js/ts 文件
 * @param {string} svg - svg 文件夹
 * @param {string} output - 生成的 asn 文件保存的路径
 * @param {boolean} [typescript=true] - 生成的 asn 文件是否是 ts 文件
 * @param {() => void} [cb] - 处理完所有文件后的回调（此时文件并没有生成）
 */
export async function generateAsnFilesFromSvgDir({
  entry,
  output,
  typescript,
  before,
  parser,
}: {
  entry: string;
  output: string;
  typescript?: boolean;
  parser?: (id: string) => { name: string; theme: string };
  before?: (files: any[]) => void;
}) {
  if (!existing(entry)) {
    return Promise.reject(new Error(`${entry} is not existing.`));
  }
  const pattern = resolve(entry, "**", "*.svg");
  // before process svg files
  const svgFilepaths = await globby(pattern);
  if (before) {
    before(svgFilepaths);
  }
  const asnOutput = resolve(output);
  ensure(asnOutput);

  const result = [];
  // begin process svg files
  for (let i = 0; i < svgFilepaths.length; i += 1) {
    const svgFilepath = svgFilepaths[i];
    const svgContent = readFileSync(svgFilepath, "utf-8");

    // 在这里计算出图标的 Identifier 和 Theme

    const asnFile = await transformer(svgContent, svgFilepath, {
      typescript,
    });

    const { theme, name, content } = asnFile;
    const asnFileOutput = resolve(asnOutput, asnFile.theme);
    ensure(asnFileOutput);
    const asnFilename = resolve(
      asnFileOutput,
      `${name}${typescript ? ".ts" : ".js"}`
    );
    // console.log("Prepare generate file", asnFilename);
    writeFileSync(asnFilename, content);

    result.push({
      ...asnFile,
      id: asnFilename,
      relativePath: `./${theme}/${name}`,
    });
  }

  const entryFileContent = entryRenderer(result, {
    parse: (asnFile) => {
      const { name, theme } = asnFile;
      return {
        identifier: getIdentifier({ name, theme }),
        path: asnFile.relativePath,
      };
    },
  });

  const entryFilepath = resolve(asnOutput, `index.${typescript ? "ts" : "js"}`);
  writeFileSync(entryFilepath, entryFileContent);

  if (typescript) {
    generateTypeFiles({ output: asnOutput });
  }

  return result;
}
