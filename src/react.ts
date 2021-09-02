/**
 * @file 渲染 react 组件
 */
import { writeFileSync } from "fs";
import { resolve, relative } from "path";
import globby from "globby";

import {
  ensure,
  existing,
  getIdentifier,
  getNameAndThemeFromPath,
} from "./utils";
import { reactIconRenderer } from "./constant";
import { entryRenderer, generateTypeFiles } from "./core";

/**
 * 从指定 asn 目录生成 react icon 文件
 */
export async function generateReactIconFilesFromAsnDir({
  asnDir,
  output,
  typescript,
}: {
  asnDir: string;
  output: string;
  typescript?: boolean;
}) {
  if (!existing(asnDir)) {
    return Promise.reject(new Error(`${asnDir} is not existing.`));
  }
  const pattern = resolve(asnDir, "**", `*.${typescript ? "t" : "j"}s`);
  const asnFilepaths = await globby(pattern);
  const reactIconOutput = resolve(output);
  ensure(reactIconOutput);

  const result = [];
  // begin process svg files
  for (let i = 0; i < asnFilepaths.length; i += 1) {
    const asnFilepath = asnFilepaths[i];

    const { name, theme } = getNameAndThemeFromPath(asnFilepath);

    const svgIdentifier = getIdentifier({ name, theme });
    const reactIconComponentContent = reactIconRenderer({
      iconsPath: relative(reactIconOutput, asnDir),
      svgIdentifier,
    });

    const reactIconComponentFilepath = resolve(
      reactIconOutput,
      `${svgIdentifier}${typescript ? ".ts" : ".js"}`
    );
    writeFileSync(reactIconComponentFilepath, reactIconComponentContent);

    result.push({
      id: reactIconComponentFilepath,
      identifier: svgIdentifier,
    });
  }

  const entryFileContent = entryRenderer(result, {
    parse: ({ identifier }) => {
      return {
        identifier,
        path: `./icons/${identifier}`,
      };
    },
  });

  const entryFilepath = resolve(
    reactIconOutput,
    `index.${typescript ? "ts" : "js"}`
  );
  writeFileSync(entryFilepath, entryFileContent);

  if (typescript) {
    generateTypeFiles({ output: reactIconOutput });
  }

  return result;
}
