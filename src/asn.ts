/**
 * @file ASN 文件的生成
 */
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

import globby from "globby";
import chalk from "chalk";

import { ensure, existing, generateTypeFiles } from "./utils";
import { ANSOutputTransformer } from "./core";
/**
 * SVG 文件读取器
 */
export async function SVGFilesReader({
  entry,
}: Partial<ASNFilesGeneratorOptions>): Promise<
  { filepath: string; content: string }[]
> {
  if (!existing(entry)) {
    return Promise.reject(new Error(`${entry} is not existing.`));
  }
  const pattern = resolve(entry!, "**", "*.svg").replace(/\\/g, "/");
  const SVGFilepaths = globby.sync(pattern);
  return SVGFilepaths.map((SVGFile) => {
    const SVGContent = readFileSync(SVGFile, "utf-8");
    return {
      filepath: SVGFile,
      content: SVGContent,
    };
  });
}

interface ASNFilesGeneratorOptions {
  /**
   * SVG 文件入口
   */
  entry: string;
  /**
   * ASN 文件输出目录
   * 如指定 /output，将会输出 /output/asn/LikeOutlined.ts 目录结构
   */
  output: string;
  /**
   * 生成 typescript 还是 javascript 文件
   */
  typescript?: boolean;
  /**
   * 输出的 ASN 文件夹名
   * 如指定 /abc，将会输出 /output/abc/LikeOutlined.ts 目录结构
   * @default 'asn'
   */
  ASNDirName?: string;
  /**
   * 是否输出更多信息
   */
  verbose?: boolean;
}

/**
 * ASN 文件生成
 */
export async function ASNFilesGenerator({
  entry,
  output,
  ASNDirName,
  typescript,
  verbose,
}: ASNFilesGeneratorOptions) {
  const SVGFiles = await SVGFilesReader({ entry });
  if (verbose) {
    console.log();
    console.log(chalk.greenBright("[ASNFilesGenerator]SVG files"), SVGFiles);
    console.log();
  }
  const ASNOutput = await ANSOutputTransformer({
    SVGFiles,
    ASNDirName,
    typescript,
    verbose,
  });
  const { entryFile: ASNEntryFile, ASNNodes } = ASNOutput;
  const ASNOutputDir = resolve(output, ASNDirName || "asn");
  ensure(ASNOutputDir);

  // generate index.ts
  writeFileSync(resolve(output, ASNEntryFile.filename), ASNEntryFile.content);
  // generate asn files
  for (let i = 0; i < ASNNodes.length; i += 1) {
    const { filename, content } = ASNNodes[i];
    const asnFilepath = resolve(ASNOutputDir, filename);
    if (verbose) {
      console.log(chalk.gray("[ASNFilesGenerator]write ASN file"), asnFilepath);
    }
    writeFileSync(asnFilepath, content);
  }
  // copy types.ts
  if (typescript) {
    generateTypeFiles({ output });
  }

  return {
    ...ASNOutput,
    output: ASNOutputDir,
  };
}
