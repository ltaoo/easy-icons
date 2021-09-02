import { statSync } from "fs";
import globby from "globby";
import { resolve } from "path";
import rimraf from "rimraf";

import { generateAsnFilesFromSvgDir } from "../asn";
import { existing } from "../utils";

const ICON_ROOT_DIR = resolve(__dirname, "../fixtures/svg");
const OUTPUT_DIR = resolve(__dirname, "../fixtures/output/asn");
function resolveSvg(...paths: string[]) {
  return resolve(ICON_ROOT_DIR, ...paths);
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
  //   const fakeBefore = jest.fn();
  //   await generateAsnFilesFromSvgDir({
  //     entry: ICON_ROOT_DIR,
  //     output: OUTPUT_DIR,
  //     before: fakeBefore,
  //   });

  //   expect(fakeBefore.mock.calls[0][0].sort()).toEqual([
  //     resolveSvg("./filled/like.svg"),
  //     resolveSvg("./outlined/like.svg"),
  //     resolveSvg("./twotone/like.svg"),
  //   ]);

  //   const generatedFiles = await globby(resolve(OUTPUT_DIR, "**", "*.js"));
  //   expect(generatedFiles.sort()).toStrictEqual([
  //     resolveOutput("./filled/like.js"),
  //     resolveOutput("./outlined/like.js"),
  //     resolveOutput("./twotone/like.js"),
  //   ]);

  //   const hasGeneratedEntry = existing(resolve(OUTPUT_DIR, "index.js"));
  //   expect(hasGeneratedEntry).toBe(true);
  // });

  it("typescript file", async () => {
    const fakeBefore = jest.fn();
    await generateAsnFilesFromSvgDir({
      entry: ICON_ROOT_DIR,
      output: OUTPUT_DIR,
      before: fakeBefore,
      typescript: true,
    });

    expect(fakeBefore.mock.calls[0][0].sort()).toEqual([
      resolveSvg("./filled/like.svg"),
      resolveSvg("./outlined/like.svg"),
      resolveSvg("./twotone/like.svg"),
    ]);

    const generatedFiles = await globby(resolve(OUTPUT_DIR, "**", "*.ts"));
    expect(generatedFiles.sort()).toStrictEqual([
      resolveOutput("./filled/like.ts"),
      resolveOutput("./index.ts"),
      resolveOutput("./outlined/like.ts"),
      resolveOutput("./twotone/like.ts"),
      resolveOutput("./types.ts"),
    ]);
  });
});
