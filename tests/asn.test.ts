import { statSync } from "fs";
import globby from "globby";
import { resolve } from "path";
import rimraf from "rimraf";

import { ASNFilesGenerator } from "../src/asn";

const ICON_ROOT_DIR = resolve(__dirname, "./fixtures/svg");
const OUTPUT_DIR = resolve(__dirname, "./output");
function resolveSvg(...paths: string[]) {
  return resolve(ICON_ROOT_DIR, ...paths);
}
function resolveOutput(...paths: string[]) {
  return resolve(OUTPUT_DIR, ...paths);
}

afterEach(async () => {
  try {
    statSync(OUTPUT_DIR);
    rimraf(OUTPUT_DIR, () => {});
  } catch (err) {
    // ...
  }
});

describe("1. generate asn string", () => {
  it("javascript file", async () => {
    await ASNFilesGenerator({
      entry: ICON_ROOT_DIR,
      output: OUTPUT_DIR,
    });

    const generatedFiles = await globby(resolve(OUTPUT_DIR, "**", "*.js"));
    expect(generatedFiles.sort()).toStrictEqual([
      resolveOutput("./asn/LikeFilled.js"),
      resolveOutput("./asn/LikeOutlined.js"),
      resolveOutput("./asn/LikeTwotone.js"),
      resolveOutput("./index.js"),
    ]);
  });

  it("typescript file", async () => {
    await ASNFilesGenerator({
      entry: ICON_ROOT_DIR,
      output: OUTPUT_DIR,
      typescript: true,
    });

    const generatedFiles = await globby(resolve(OUTPUT_DIR, "**", "*.ts"));
    expect(generatedFiles.sort()).toStrictEqual([
      resolveOutput("./asn/LikeFilled.ts"),
      resolveOutput("./asn/LikeOutlined.ts"),
      resolveOutput("./asn/LikeTwotone.ts"),
      resolveOutput("./index.ts"),
      resolveOutput("./types.ts"),
    ]);
  });
});
