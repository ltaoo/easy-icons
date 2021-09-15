import { statSync } from "fs";
import globby from "globby";
import { resolve } from "path";
import rimraf from "rimraf";

import {
  reactIconsGenerator,
  reactIconsGeneratorFromSVGDir,
  singleReactIconGenerator,
} from "../src/react";

const JS_ICON_ROOT_DIR = resolve(__dirname, "./fixtures/asn-js");
const TS_ICON_ROOT_DIR = resolve(__dirname, "./fixtures/asn-ts");
const OUTPUT_DIR = resolve(__dirname, "./output");
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

// describe("1. generate asn string", () => {
//   it("javascript file", async () => {
//     await generateReactIconFilesFromAsnDir({
//       asnDir: JS_ICON_ROOT_DIR,
//       output: OUTPUT_DIR,
//     });

//     const generatedFiles = await globby([
//       resolve(OUTPUT_DIR, "**", "*.js"),
//       resolve(OUTPUT_DIR, "**", "*.jsx"),
//     ]);
//     expect(generatedFiles.sort()).toStrictEqual([
//       resolveOutput("./icons/LikeFilled.jsx"),
//       resolveOutput("./icons/LikeOutlined.jsx"),
//       resolveOutput("./icons/LikeTwotone.jsx"),
//       resolveOutput("./index.js"),
//     ]);
//   });

//   it("typescript file", async () => {
//     await generateReactIconFilesFromAsnDir({
//       asnDir: TS_ICON_ROOT_DIR,
//       output: OUTPUT_DIR,
//       typescript: true,
//     });
//     const generatedFiles = await globby([
//       resolve(OUTPUT_DIR, "**", "*.ts"),
//       resolve(OUTPUT_DIR, "**", "*.tsx"),
//     ]);
//     expect(generatedFiles.sort()).toStrictEqual([
//       resolveOutput("./components/AntdIcon.tsx"),
//       resolveOutput("./components/Icon.tsx"),
//       resolveOutput("./components/IconBase.tsx"),
//       resolveOutput("./components/IconFont.tsx"),
//       resolveOutput("./components/twoTonePrimaryColor.ts"),
//       resolveOutput("./components/utils.ts"),
//       resolveOutput("./icons/LikeFilled.tsx"),
//       resolveOutput("./icons/LikeOutlined.tsx"),
//       resolveOutput("./icons/LikeTwotone.tsx"),
//       resolveOutput("./index.ts"),
//       resolveOutput("./types.ts"),
//     ]);
//   });
// });

const ICON_ROOT_DIR = resolve(__dirname, "./fixtures/svg");
function resolveSvg(...paths: string[]) {
  return resolve(ICON_ROOT_DIR, ...paths);
}

// describe("2. directly generate react icons from svg icons", () => {
//   it("typescript file", async () => {
//     await reactIconsGeneratorFromSVGDir({
//       entry: ICON_ROOT_DIR,
//       output: OUTPUT_DIR,
//       typescript: true,
//     });
//     const generatedFiles = await globby([
//       resolve(OUTPUT_DIR, "**", "*.ts"),
//       resolve(OUTPUT_DIR, "**", "*.tsx"),
//     ]);
//     expect(generatedFiles.sort()).toStrictEqual([
//       resolveOutput("./asn/LikeFilled.ts"),
//       resolveOutput("./asn/LikeOutlined.ts"),
//       resolveOutput("./asn/LikeTwotone.ts"),
//       resolveOutput("./components/AntdIcon.tsx"),
//       resolveOutput("./components/Icon.tsx"),
//       resolveOutput("./components/IconBase.tsx"),
//       resolveOutput("./components/IconFont.tsx"),
//       resolveOutput("./components/twoTonePrimaryColor.ts"),
//       resolveOutput("./components/utils.ts"),
//       resolveOutput("./icons/LikeFilled.tsx"),
//       resolveOutput("./icons/LikeOutlined.tsx"),
//       resolveOutput("./icons/LikeTwotone.tsx"),
//       resolveOutput("./index.ts"),
//       resolveOutput("./types.ts"),
//     ]);
//   });
//   it("javascript file", async () => {
//     await reactIconsGeneratorFromSVGDir({
//       entry: ICON_ROOT_DIR,
//       output: OUTPUT_DIR,
//     });
//     const generatedFiles = await globby([
//       resolve(OUTPUT_DIR, "**", "*.js"),
//       resolve(OUTPUT_DIR, "**", "*.jsx"),
//     ]);
//     expect(generatedFiles.sort()).toStrictEqual([
//       resolveOutput("./asn/LikeFilled.js"),
//       resolveOutput("./asn/LikeOutlined.js"),
//       resolveOutput("./asn/LikeTwotone.js"),
//       resolveOutput("./components/AntdIcon.jsx"),
//       resolveOutput("./components/Icon.jsx"),
//       resolveOutput("./components/IconBase.jsx"),
//       resolveOutput("./components/IconFont.jsx"),
//       resolveOutput("./components/twoTonePrimaryColor.js"),
//       resolveOutput("./components/utils.js"),
//       resolveOutput("./icons/LikeFilled.jsx"),
//       resolveOutput("./icons/LikeOutlined.jsx"),
//       resolveOutput("./icons/LikeTwotone.jsx"),
//       resolveOutput("./index.js"),
//     ]);
//   });

//   it("single javascript file", async () => {
//     await singleReactIconGenerator({
//       SVGPath: resolve(ICON_ROOT_DIR, "./outlined/like.svg"),
//       output: OUTPUT_DIR,
//     });
//     const generatedFiles = await globby([
//       resolve(OUTPUT_DIR, "**", "*.js"),
//       resolve(OUTPUT_DIR, "**", "*.jsx"),
//     ]);
//     expect(generatedFiles.sort()).toStrictEqual([
//       resolveOutput("./asn/LikeFilled.js"),
//       resolveOutput("./icons/LikeFilled.jsx"),
//       resolveOutput("./index.js"),
//     ]);
//   });

//   it("single javascript file", async () => {
//     await singleReactIconGenerator({
//       SVGPath: resolve(ICON_ROOT_DIR, "./filled/like.svg"),
//       output: OUTPUT_DIR,
//       typescript: true,
//     });
//     const generatedFiles = await globby([
//       resolve(OUTPUT_DIR, "**", "*.ts"),
//       resolve(OUTPUT_DIR, "**", "*.tsx"),
//     ]);
//     expect(generatedFiles.sort()).toStrictEqual([
//       resolveOutput("./asn/LikeFilled.ts"),
//       resolveOutput("./icons/LikeFilled.tsx"),
//       resolveOutput("./index.ts"),
//     ]);
//   });
// });

// describe("3. monorepo", () => {
//   it("typescript file", async () => {
//     await reactIconsGeneratorFromSVGDir({
//       entry: ICON_ROOT_DIR,
//       output: OUTPUT_DIR,
//       ASNFilepath: "@cf2e/icons-svg/lib/asn",
//       ASNOutputDir: resolve(OUTPUT_DIR, "packages/asn/src"),
//       iconsOutputDir: resolve(OUTPUT_DIR, "packages/icons/src"),
//       typescript: true,
//     });
//     const generatedFiles = await globby([
//       resolve(OUTPUT_DIR, "**", "*.ts"),
//       resolve(OUTPUT_DIR, "**", "*.tsx"),
//     ]);
//     expect(generatedFiles.sort()).toStrictEqual([
//       // asn package
//       resolveOutput("./packages/asn/src/asn/LikeFilled.ts"),
//       resolveOutput("./packages/asn/src/asn/LikeOutlined.ts"),
//       resolveOutput("./packages/asn/src/asn/LikeTwotone.ts"),
//       resolveOutput("./packages/asn/src/index.ts"),
//       resolveOutput("./packages/asn/src/types.ts"),
//       // react icon package
//       resolveOutput("./packages/icons/src/components/AntdIcon.tsx"),
//       resolveOutput("./packages/icons/src/components/Icon.tsx"),
//       resolveOutput("./packages/icons/src/components/IconBase.tsx"),
//       resolveOutput("./packages/icons/src/components/IconFont.tsx"),
//       resolveOutput("./packages/icons/src/components/twoTonePrimaryColor.ts"),
//       resolveOutput("./packages/icons/src/components/utils.ts"),
//       resolveOutput("./packages/icons/src/icons/LikeFilled.tsx"),
//       resolveOutput("./packages/icons/src/icons/LikeOutlined.tsx"),
//       resolveOutput("./packages/icons/src/icons/LikeTwotone.tsx"),
//       resolveOutput("./packages/icons/src/index.ts"),
//       resolveOutput("./packages/icons/src/types.ts"),
//     ]);
//   });
// });

describe("4. react icon repo", () => {
  it("typescript file", async () => {
    await reactIconsGeneratorFromSVGDir({
      entry: ICON_ROOT_DIR,
      output: resolve(OUTPUT_DIR, "src"),
      typescript: true,
    });
    const generatedFiles = await globby([
      resolve(OUTPUT_DIR, "**", "*.ts"),
      resolve(OUTPUT_DIR, "**", "*.tsx"),
    ]);
    expect(generatedFiles.sort()).toStrictEqual([
      resolveOutput("./src/asn/LikeFilled.ts"),
      resolveOutput("./src/asn/LikeOutlined.ts"),
      resolveOutput("./src/asn/LikeTwotone.ts"),
      resolveOutput("./src/components/AntdIcon.tsx"),
      resolveOutput("./src/components/Icon.tsx"),
      resolveOutput("./src/components/IconBase.tsx"),
      resolveOutput("./src/components/IconFont.tsx"),
      resolveOutput("./src/components/twoTonePrimaryColor.ts"),
      resolveOutput("./src/components/utils.ts"),
      resolveOutput("./src/icons/LikeFilled.tsx"),
      resolveOutput("./src/icons/LikeOutlined.tsx"),
      resolveOutput("./src/icons/LikeTwotone.tsx"),
      resolveOutput("./src/index.ts"),
      resolveOutput("./src/types.ts"),
    ]);
  });
  it("javascript file", async () => {
    await reactIconsGeneratorFromSVGDir({
      entry: ICON_ROOT_DIR,
      output: resolve(OUTPUT_DIR, "src"),
    });
    const generatedFiles = await globby([
      resolve(OUTPUT_DIR, "**", "*.js"),
      resolve(OUTPUT_DIR, "**", "*.jsx"),
    ]);
    expect(generatedFiles.sort()).toStrictEqual([
      resolveOutput("./src/asn/LikeFilled.js"),
      resolveOutput("./src/asn/LikeOutlined.js"),
      resolveOutput("./src/asn/LikeTwotone.js"),
      resolveOutput("./src/components/AntdIcon.jsx"),
      resolveOutput("./src/components/Icon.jsx"),
      resolveOutput("./src/components/IconBase.jsx"),
      resolveOutput("./src/components/IconFont.jsx"),
      resolveOutput("./src/components/twoTonePrimaryColor.js"),
      resolveOutput("./src/components/utils.js"),
      resolveOutput("./src/icons/LikeFilled.jsx"),
      resolveOutput("./src/icons/LikeOutlined.jsx"),
      resolveOutput("./src/icons/LikeTwotone.jsx"),
      resolveOutput("./src/index.js"),
    ]);
  });
});
