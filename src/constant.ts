import { readFileSync } from "fs";
import { resolve } from "path";

import template from "lodash.template";

const THIS_ROOT_DIR = resolve(__dirname);
const TEMPLATES_DIR = resolve(THIS_ROOT_DIR, "./templates");
export function r(...paths: string[]) {
  return resolve(THIS_ROOT_DIR, ...paths);
}
const ASN_TEMPLATE = readFileSync(resolve(TEMPLATES_DIR, "asn.ts.ejs"), "utf8");

export const asnRenderer = template(ASN_TEMPLATE);

export const REACT_ICON_TEMPLATE = readFileSync(
  resolve(TEMPLATES_DIR, "react/icon.tsx.ejs"),
  "utf-8"
);
export const reactIconRenderer = template(REACT_ICON_TEMPLATE);
