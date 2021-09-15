/**
 * @file react icon 文件的生成
 */
import { readFileSync, statSync, writeFileSync } from "fs";
import { relative, resolve } from "path";

import cpy from "cpy";
import chalk from "chalk";

import { ensure, ext, generateTypeFiles } from "./utils";
import {
  ANSOutputTransformer,
  ASNNodeTransformer,
  entryRenderer,
  reactIconsOutputTransformer,
  reactIconTransformer,
} from "./core";
import { ASNFilesGenerator, SVGFilesReader } from "./asn";

interface ReactIconsGeneratorOptions {
  /**
   * SVG 目录
   */
  // entry?: string;
  /**
   * react icon 入口文件
   */
  entryFile: { filename: string; content: string };
  /**
   * react icon 列表
   */
  icons: { filename: string; identifier: string; content: string }[];
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
  /**
   * 输出更多信息
   */
  verbose?: boolean;
}

/**
 * react icons 生成器
 */
export async function reactIconsGenerator({
  entryFile,
  icons,
  output,
  iconsDirName,
  typescript,
  verbose,
}: ReactIconsGeneratorOptions) {
  const reactIconOutputDir = resolve(output, iconsDirName || "icons");

  ensure(reactIconOutputDir);
  const result = [];
  for (let i = 0; i < icons.length; i += 1) {
    const { filename, identifier, content } = icons[i];
    const reactIconFilepath = resolve(reactIconOutputDir, filename);
    writeFileSync(reactIconFilepath, content);
    result.push({
      id: reactIconFilepath,
      identifier,
    });
  }
  const entryFilepath = resolve(output, entryFile.filename);
  writeFileSync(entryFilepath, entryFile.content);
  if (typescript) {
    generateTypeFiles({ output });
  }
  await copyIconComponents({ output, typescript });
  return result;
}

/**
 * 从 SVG 目录生成 react icons
 */
export async function reactIconsGeneratorFromSVGDir({
  entry,
  output,
  ASNOutputDir,
  iconsOutputDir,
  iconsDirName,
  ASNFilepath,
  typescript,
  verbose,
}: {
  entry: string;
  output?: string;
  ASNOutputDir?: string;
  iconsOutputDir?: string;
  iconsDirName?: string;
  ASNFilepath?: string;
  typescript?: boolean;
  verbose?: boolean;
}) {
  // @TODO output 或 (iconsOutputDir 与 ASNOutputDir) 两者必须存在一个，需要进行错误检查
  const latestReactIconOutputDir = (iconsOutputDir || output)!;
  const reactIconOutputDir = resolve(
    latestReactIconOutputDir,
    iconsDirName || "icons"
  );
  const latestAnsOutputDir = (ASNOutputDir || output)!;
  if (verbose) {
    console.log(chalk.gray("[ReactIconsGenerator]the SVG entry is"), entry);
  }
  const ASNOutput = await ASNFilesGenerator({
    entry,
    output: latestAnsOutputDir,
    typescript,
    verbose,
  });
  if (verbose) {
    console.log();
    console.log(
      chalk.greenBright("[ReactIconsGenerator]ASN output"),
      ASNOutput.ASNNodes
    );
  }
  const reactIconOutput = await reactIconsOutputTransformer({
    ASNNodes: ASNOutput.ASNNodes,
    ASNFilepath:
      ASNFilepath ||
      relative(reactIconOutputDir, ASNOutput.output).replace(/\\/g, "/"),
    typescript,
  });
  const { icons, entryFile } = reactIconOutput;
  if (verbose) {
    console.log(
      chalk.greenBright("[ReactIconsGenerator]react icons output"),
      icons
    );
  }

  // 这部分逻辑是重复的
  ensure(reactIconOutputDir);
  const result = [];
  for (let i = 0; i < icons.length; i += 1) {
    const { filename, identifier, content } = icons[i];
    const reactIconFilepath = resolve(reactIconOutputDir, filename);
    if (verbose) {
      console.log(
        chalk.gray("[ReactIconsGenerator]write react icon"),
        reactIconFilepath
      );
    }
    writeFileSync(reactIconFilepath, content);
    result.push({
      id: reactIconFilepath,
      identifier,
    });
  }
  if (ASNOutputDir && iconsOutputDir) {
    const ASNEntryFilepath = resolve(
      latestAnsOutputDir,
      ASNOutput.entryFile.filename
    );
    if (verbose) {
      console.log(
        chalk.gray("[ReactIconsGenerator]write ASN entry"),
        ASNEntryFilepath
      );
    }
    writeFileSync(ASNEntryFilepath, ASNOutput.entryFile.content);
    const reactIconEntryFilepath = resolve(
      latestReactIconOutputDir,
      entryFile.filename
    );
    if (verbose) {
      console.log(
        chalk.gray("[ReactIconsGenerator]write React icon entry"),
        reactIconEntryFilepath
      );
    }
    writeFileSync(reactIconEntryFilepath, entryFile.content);
  } else {
    const entryFilepath = resolve(output!, entryFile.filename);
    writeFileSync(entryFilepath, entryFile.content);
  }

  if (typescript) {
    if (ASNOutputDir && iconsOutputDir) {
      generateTypeFiles({ output: latestAnsOutputDir });
      generateTypeFiles({ output: latestReactIconOutputDir });
    } else {
      generateTypeFiles({ output: output! });
    }
  }

  await copyIconComponents({ output: latestReactIconOutputDir, typescript });
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
    await cpy(resolve(__dirname, "templates/react-ts/components/**"), output, {
      rename: (basename: string) => `components/${basename}`,
    });
    return;
  }
  await cpy(resolve(__dirname, "templates/react-js/components/**"), output, {
    rename: (basename: string) => `components/${basename}`,
  });
}

interface SingleReactIconGeneratorOptions {
  SVGPath: string;
  output: string;
  ASNDirName?: string;
  iconsDirName?: string;
  typescript?: boolean;
}
function tmpEntryRender({
  identifier,
  output,
  iconsDirName,
}: {
  identifier: string;
  output: string;
  iconsDirName: string;
}) {
  const path = relative(
    output,
    resolve(output, iconsDirName, identifier)
  ).replace(/\\/g, "/");
  return entryRenderer<string>([identifier], {
    parse(identifier) {
      return {
        identifier,
        path: path.charAt(0) === "." ? path : `./${path}`,
      };
    },
  });
}
/**
 * 单个 icon 组件生成
 * 为了增量生成 icon
 */
export async function singleReactIconGenerator({
  SVGPath,
  output,
  ASNDirName,
  iconsDirName,
  typescript,
}: SingleReactIconGeneratorOptions) {
  const SVGFileContent = readFileSync(SVGPath, "utf-8");
  const ASNNode = await ASNNodeTransformer(SVGFileContent, SVGPath, {
    typescript,
  });
  const ASNOutputDir = resolve(output, ASNDirName || "asn");
  ensure(ASNOutputDir);
  // generate asn file
  writeFileSync(resolve(ASNOutputDir, ASNNode.filename), ASNNode.content);
  // generate icon file
  const reactIconOutputDir = resolve(output, iconsDirName || "icons");
  ensure(reactIconOutputDir);
  const reactIcon = await reactIconTransformer({
    ASNFilepath: relative(reactIconOutputDir, ASNOutputDir).replace(/\\/g, "/"),
    identifier: ASNNode.identifier,
    typescript,
  });
  writeFileSync(
    resolve(reactIconOutputDir, reactIcon.filename),
    reactIcon.content
  );
  // update entry file
  const entryFilepath = resolve(output, `index${ext(typescript)}`);
  try {
    statSync(entryFilepath);
    const prevEntryFileContent = readFileSync(entryFilepath, "utf-8");
    // if index.ts has existing, update
    if (prevEntryFileContent.includes(ASNNode.identifier)) {
      return ASNNode;
    }
    const newIconExported = tmpEntryRender({
      identifier: ASNNode.identifier,
      output,
      iconsDirName: iconsDirName || "icons",
    });
    writeFileSync(entryFilepath, `${prevEntryFileContent}\n${newIconExported}`);
  } catch (err) {
    // if index.ts not existing, create one
    const entryFileContent = tmpEntryRender({
      identifier: ASNNode.identifier,
      output,
      iconsDirName: iconsDirName || "icons",
    });
    writeFileSync(entryFilepath, entryFileContent);
  }
  return ASNNode;
}
