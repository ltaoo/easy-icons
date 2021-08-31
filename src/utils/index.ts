import { parse, basename, dirname } from "path";
import { statSync, mkdirSync } from "fs";

import upperFirst from "lodash.upperfirst";
import camelCase from "lodash.camelcase";
import { pipe } from "ramda";

import { ThemeType, ThemeTypeUpperCase } from "../types";

export interface IdentifierMeta {
  name: string;
  themeSuffix?: ThemeTypeUpperCase;
}

export interface GetIdentifierType {
  (meta: IdentifierMeta): string;
}

/**
 * 根据 name 和 theme 生成驼峰命名
 * like + Outlined -> LikeOutlined
 * like + Filled -> LikeFilled
 */
export const getIdentifier: GetIdentifierType = pipe(
  ({ name, themeSuffix }: IdentifierMeta) =>
    name + (themeSuffix ? `-${themeSuffix}` : ""),
  camelCase,
  upperFirst
);

/**
 * 从文件路径中解析出 name 和 theme
 * @param {string} filepath
 */
export function getNameAndThemeFromPath(filepath: string) {
  const { name, dir } = parse(filepath);
  const theme = basename(dir) as ThemeType;
  return {
    name,
    theme,
  };
}

/**
 *
 * @param {string} dir
 */
export function existing(dir: string) {
  try {
    statSync(dir);
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * create dir if dir don't existing.
 * @param filepath
 * @param next
 */
export function ensure(filepath: string, next: string[] = []) {
  try {
    statSync(filepath);
    if (next.length !== 0) {
      mkdirSync(next.pop() as string);
      ensure(filepath, next);
    }
  } catch {
    const needToCreate = dirname(filepath);
    ensure(needToCreate, next.concat(filepath));
  }
}

/**
 * check the filepath is npm package name
 * @param filepath
 */
export function checkIsNpmPackage(filepath: string) {
  const firstChar = filepath.charAt(0);
  const secondChar = filepath.charAt(1);
  // ./path、/path
  if ([".", "/"].includes(firstChar)) {
    return false;
  }
  // @/path
  if (["@"].includes(firstChar) && ["/"].includes(secondChar)) {
    return false;
  }
  return true;
}
