/**
 * @file react icon 文件的生成
 */
import { writeFileSync } from "fs";
import { relative, resolve } from "path";

import cpy from "cpy";

import { ensure, generateTypeFiles } from "./utils";
import { ANSOutputTransformer, reactIconsOutputTransformer } from "./core";
import { ASNFilesGenerator, SVGFilesReader } from "./asn";

interface ReactIconsGeneratorOptions {
  /**
   * SVG 目录
   */
  entry?: string;
  /**
   * react icon 入口文件
   */
  entryFile?: { filename: string; content: string };
  /**
   * react icon 列表
   */
  icons?: { filename: string; identifier: string; content: string }[];
  /**
   * react icons 输出目录
   */
  output: string;
  /**
   * icons 文件夹名称
   */
  iconsDirName?: string;
  /**
   * 生成 ts
   */
  typescript?: boolean;
}
/**
 * react icons 生成器
 */
export async function reactIconsGenerator({
  entry,
  entryFile,
  icons,
  output,
  iconsDirName,
  typescript,
}: ReactIconsGeneratorOptions) {
  const reactIconOutputDir = resolve(output, iconsDirName || "icons");
  const { reactIcons, reactIconEntryFile } = await (async () => {
    if (entry) {
      const ASNOutput = await ASNFilesGenerator({ entry, output, typescript });
      const reactIconOutput = await reactIconsOutputTransformer({
        ASNNodes: ASNOutput.ASNNodes,
        ASNFilepath: relative(reactIconOutputDir, ASNOutput.output),
        typescript,
      });
      return {
        reactIconEntryFile: reactIconOutput.entryFile,
        reactIcons: reactIconOutput.icons,
      };
    }
    // 如果 entry 是空，entryFile、icons 也为空，应该报错
    return {
      reactIconEntryFile: entryFile,
      reactIcons: icons || [],
    };
  })();

  ensure(reactIconOutputDir);

  const result = [];
  for (let i = 0; i < reactIcons.length; i += 1) {
    const { filename, identifier, content } = reactIcons[i];

    const reactIconFilepath = resolve(reactIconOutputDir, filename);
    writeFileSync(reactIconFilepath, content);

    result.push({
      id: reactIconFilepath,
      identifier,
    });
  }

  if (reactIconEntryFile) {
    const entryFilepath = resolve(output, reactIconEntryFile.filename);
    writeFileSync(entryFilepath, reactIconEntryFile.content);
  }

  if (typescript) {
    generateTypeFiles({ output });
  }

  await copyIconComponents({ output, typescript });

  return result;
}

/**
 *
 */
async function copyIconComponents({
  output,
  typescript,
}: {
  output: string;
  typescript?: boolean;
}) {
  if (typescript === true) {
    await cpy("templates/react-ts/components/**", output, {
      rename: (basename) => `components/${basename}`,
    });
    return;
  }
  await cpy("templates/react-js/components/**", output, {
    rename: (basename) => `components/${basename}`,
  });
}
