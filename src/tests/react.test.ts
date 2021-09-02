import { statSync } from "fs";
import globby from "globby";
import { resolve } from "path";
import rimraf from "rimraf";

import { generateReactIconFilesFromAsnDir } from "../react";

const JS_ICON_ROOT_DIR = resolve(__dirname, "../fixtures/asn-js");
const TS_ICON_ROOT_DIR = resolve(__dirname, "../fixtures/asn-ts");
const OUTPUT_DIR = resolve(__dirname, "../fixtures/output");
function resolveJsIcon(...paths: string[]) {
  return resolve(JS_ICON_ROOT_DIR, ...paths);
}
function resolveTsIcon(...paths: string[]) {
  return resolve(TS_ICON_ROOT_DIR, ...paths);
}
function resolveOutput(...paths: string[]) {
  return resolve(OUTPUT_DIR, ...paths);
}

// afterEach(async () => {
//   try {
//     statSync(OUTPUT_DIR);
//     rimraf(OUTPUT_DIR, () => {});
//   } catch (err) {
//     // ...
//   }
// });

describe("1. generate asn string", () => {
  // it("javascript file", async () => {
  //   await generateReactIconFilesFromAsnDir({
  //     asnDir: JS_ICON_ROOT_DIR,
  //     output: OUTPUT_DIR,
  //   });

  // const generatedFiles = await globby([resolve(OUTPUT_DIR, "**", "*.js"), resolve(OUTPUT_DIR, "**", "*.jsx")]);
  //   expect(generatedFiles.sort()).toStrictEqual([
  //     resolveOutput("./icons/LikeFilled.jsx"),
  //     resolveOutput("./icons/LikeOutlined.jsx"),
  //     resolveOutput("./icons/LikeTwotone.jsx"),
  //     resolveOutput("./index.js"),
  //   ]);
  // });

  it("typescript file", async () => {
    await generateReactIconFilesFromAsnDir({
      asnDir: TS_ICON_ROOT_DIR,
      output: OUTPUT_DIR,
      typescript: true,
    });
    const generatedFiles = await globby([
      resolve(OUTPUT_DIR, "**", "*.ts"),
      resolve(OUTPUT_DIR, "**", "*.tsx"),
    ]);
    expect(generatedFiles.sort()).toStrictEqual([
      resolveOutput("./components/AntdIcon.tsx"),
      resolveOutput("./components/Icon.tsx"),
      resolveOutput("./components/IconBase.tsx"),
      resolveOutput("./components/IconFont.tsx"),
      resolveOutput("./components/twoTonePrimaryColor.ts"),
      resolveOutput("./components/utils.ts"),
      resolveOutput("./icons/LikeFilled.tsx"),
      resolveOutput("./icons/LikeOutlined.tsx"),
      resolveOutput("./icons/LikeTwotone.tsx"),
      resolveOutput("./index.ts"),
      resolveOutput("./types.ts"),
    ]);
  });
});
