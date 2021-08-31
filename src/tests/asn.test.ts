import { readFileSync, statSync, rmdirSync } from "fs";
import { resolve } from "path";
import rimraf from "rimraf";

import { generateAsnFilesFromSvgDir } from "../asn";

const ICON_ROOT_DIR = resolve(__dirname, "../fixtures/svg");
const OUTPUT_DIR = resolve(__dirname, "../fixtures/output");
function resolveSvg(...paths: string[]) {
  return resolve(ICON_ROOT_DIR, ...paths);
}
function resolveOutput(...paths: string[]) {
  return resolve(OUTPUT_DIR, ...paths);
}

beforeAll(async () => {
  try {
    statSync(OUTPUT_DIR);
    rimraf(OUTPUT_DIR, () => {});
  } catch (err) {
    // ...
  }
});

describe("1. generate asn string", () => {
  it("Outlined svg icon", async () => {
    const fakeBefore = jest.fn();
    await generateAsnFilesFromSvgDir({
      entry: ICON_ROOT_DIR,
      output: OUTPUT_DIR,
      before: fakeBefore,
    });

    expect(fakeBefore.mock.calls[0][0]).toEqual([
      resolveSvg("./filled/like.svg"),
      resolveSvg("./outlined/like.svg"),
      resolveSvg("./twotone/like.svg"),
      // resolveOutput("./svg/filled/like.svg"),
      // resolveOutput("./svg/outlined/like.svg"),
      // resolveOutput("./svg/twotone/like.svg"),
    ]);
  });
});
