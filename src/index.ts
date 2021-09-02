import { writeFileSync } from "fs";
import { resolve, parse, dirname } from "path";

import template from "lodash.template";
import globby from "globby";

import { ensure, checkIsNpmPackage } from "./utils";
import { r } from "./constant";

const cwd = process.cwd();

