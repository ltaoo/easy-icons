import SVGO from "svgo";

import template from "lodash.template";
import upperFirst from "lodash.upperfirst";

import { asnGenerator } from "./plugins/svg2Definition";
import { generalConfig, remainFillConfig } from "./plugins/svgo/presets";
import {
  assignAttrsAtTag,
  adjustViewBox,
  setDefaultColorAtPathTag,
} from "./plugins/svg2Definition/transforms";
import { twotoneStringify } from "./plugins/svg2Definition/stringify";
import { ThemeType, ThemeTypeUpperCase } from "./types";
import { getNameAndThemeFromPath, getIdentifier } from "./utils";

const DEFAULT_SVG_CONFIG_MAP: { [key: string]: any } = {
  twotone: remainFillConfig,
};
const SVG_CONFIG_MAP = new Proxy(DEFAULT_SVG_CONFIG_MAP, {
  get(target, key: ThemeType) {
    if (target[key]) {
      return target[key];
    }
    return generalConfig;
  },
});

/**
 * transform svg to js object
 * @param {string} svg - svg file content
 * @param {string} name - svg filename
 * @param {string} theme - svg theme
 */
export async function svg2asn(svg: string, name: string, theme: string) {
  const optimizer = new SVGO(SVG_CONFIG_MAP[theme]);
  const { data } = await optimizer.optimize(svg);

  if (theme === "twotone") {
    return asnGenerator(data, {
      name,
      theme,
      extraNodeTransformFactories: [
        assignAttrsAtTag("svg", { focusable: "false" }),
        adjustViewBox,
        setDefaultColorAtPathTag("#333"),
      ],
      stringify: twotoneStringify,
    });
  }
  return asnGenerator(data, {
    name,
    theme,
    extraNodeTransformFactories: [
      assignAttrsAtTag("svg", { focusable: "false" }),
      adjustViewBox,
    ],
    stringify: JSON.stringify,
  });
}

const ASN_TS_FILE_CONTENT_TEMPLATE = `// This icon file is generated automatically.

import { IconDefinition } from '../types';

const <%= identifier %>: IconDefinition = <%= content %>;

export default <%= identifier %>;`;

const ASN_JS_FILE_CONTENT_TEMPLATE = `// This icon file is generated automatically.

const <%= identifier %> = <%= content %>;

export default <%= identifier %>;`;

/**
 * generate asn file content that prepare write to local file
 * @param {string} asn - svg2asn 转换得到的 asn
 * @param {boolean} [typescript=true] - 是否生成 ts 文件
 * @example
 *
 */
export function createAsnFileContent(
  asn: string,
  {
    name,
    theme,
    typescript,
  }: { name: string; theme: string; typescript?: boolean }
) {
  // console.log("[CORE]createAsnFile", asn, typeof asn);
  const mapToInterpolate = ({
    name,
    content,
  }: {
    name: string;
    content: string;
  }) => {
    const identifier = getIdentifier({
      name,
      themeSuffix: theme ? upperFirst(theme) : undefined,
    });
    return {
      identifier,
      content: content,
      typescript,
    };
  };
  return template(
    typescript ? ASN_TS_FILE_CONTENT_TEMPLATE : ASN_JS_FILE_CONTENT_TEMPLATE
  )(mapToInterpolate({ name, content: asn }));
}

interface ITransformerOptions {
  typescript?: boolean;
  parser?: (id: string) => { name: string; theme: string };
}
/**
 *
 * @param {string} content
 * @param {string} id
 * @param {boolean} params.typescript
 * @returns
 */
export async function transformer(
  content: string,
  id: string,
  { typescript, parser }: ITransformerOptions
) {
  const { name, theme } = parser ? parser(id) : getNameAndThemeFromPath(id);
  const asnContent = await svg2asn(content, name, theme);
  const asnFileContent = createAsnFileContent(asnContent, {
    name,
    theme,
    typescript,
  });
  return {
    id,
    content: asnFileContent,
    name,
    theme,
  };
}

const NAME_EXPORT_TEMPLATE =
  "export { default as <%= identifier %> } from '<%= path %>';";
const defaultParse = (file: string) => {
  return {
    identifier: file,
    path: `./${file}`,
  };
};
/**
 * generate src/index.ts file
 * @example
 * ['../asn/outlined/like']
 * export { default as LikeOutlined } from '../asn/outlined/like';
 */
export async function entryRenderer({
  files,
  parse,
}: {
  files: string[];
  parse: (file: string) => { identifier: string; path: string };
}) {
  const fileContent = files
    .map((file) => {
      const { identifier, path } = parse(file);
      return template(NAME_EXPORT_TEMPLATE)({ identifier, path });
    })
    .join("\n");
  return fileContent;
}
