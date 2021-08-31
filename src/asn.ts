/**
 * @file 输入 svg icon 目录，在指定目录输出 asn 文件
 */
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

import globby from "globby";

import { existing, ensure } from "./utils";
import { transformer } from "./core";

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
    const asnFile = await transformer(svgContent, svgFilepath, {
      typescript,
      parser,
    });

    const asnFileOutput = resolve(asnOutput, asnFile.theme);
    ensure(asnFileOutput);
    const asnFilename = resolve(
      asnFileOutput,
      `${asnFile.name}${typescript ? ".ts" : ".js"}`
    );
    // console.log("Prepare generate file", asnFilename);
    writeFileSync(asnFilename, asnFile.content);

    result.push({
      ...asnFile,
      id: asnFilename,
    });
  }

  return result;
}
