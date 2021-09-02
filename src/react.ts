/**
 * @file 渲染 react 组件
 */
import { writeFileSync } from "fs";
import { resolve, relative, parse } from "path";

import globby from "globby";
import cpy from "cpy";

import { ensure, existing, ext } from "./utils";
import {
  reactJsIconComponentRenderer,
  reactTsIconComponentRenderer,
  REACT_JS_ICON_COMPONENTS_DIR,
  REACT_TS_ICON_COMPONENTS_DIR,
} from "./constant";
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
  const pattern = resolve(asnDir, "**", ext(typescript, "*"));
  const asnFilepaths = await globby(pattern);
  const reactIconOutput = resolve(output, "icons");
  ensure(reactIconOutput);

  const result = [];
  // begin process svg files
  for (let i = 0; i < asnFilepaths.length; i += 1) {
    const asnFilepath = asnFilepaths[i];

    if (
      asnFilepath.includes(`index${ext(typescript)}`) ||
      asnFilepath.includes(`types${ext(typescript)}`)
    ) {
      continue;
    }

    const { name } = parse(asnFilepath);

    const svgIdentifier = name;
    const renderer = typescript
      ? reactTsIconComponentRenderer
      : reactJsIconComponentRenderer;
    const reactIconComponentContent = renderer({
      iconsPath: relative(reactIconOutput, resolve(asnDir, "./asn")),
      svgIdentifier,
    });

    const reactIconComponentFilepath = resolve(
      reactIconOutput,
      `${svgIdentifier}${ext(typescript, "", "x")}`
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

  const entryFilepath = resolve(output, `index${ext(typescript)}`);
  writeFileSync(entryFilepath, entryFileContent);

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
