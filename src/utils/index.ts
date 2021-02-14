import { parse, basename } from 'path';

import upperFirst from 'lodash.upperfirst';
import camelCase from 'lodash.camelcase';
import { pipe } from 'ramda';

import { ThemeType, ThemeTypeUpperCase } from '../types';

export interface IdentifierMeta {
  name: string;
  themeSuffix?: ThemeTypeUpperCase;
}

export interface GetIdentifierType {
  (meta: IdentifierMeta): string;
}

/**
 * 根据 name 和 theme 生成驼峰命名
 */
export const getIdentifier: GetIdentifierType = pipe(
  ({ name, themeSuffix }: IdentifierMeta) =>
    name + (themeSuffix ? `-${themeSuffix}` : ''),
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


