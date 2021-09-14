import SVGO from "svgo";

import template from "lodash.template";
import upperFirst from "lodash.upperfirst";
import chalk from "chalk";

import { asnGenerator } from "./plugins/svg2Definition";
import { generalConfig, remainFillConfig } from "./plugins/svgo/presets";
import {
  assignAttrsAtTag,
  adjustViewBox,
  setDefaultColorAtPathTag,
} from "./plugins/svg2Definition/transforms";
import { twotoneStringify } from "./plugins/svg2Definition/stringify";
import { ThemeType } from "./types";
import { getNameAndThemeFromPath, getIdentifier, ext } from "./utils";
import {
  reactJsIconComponentRenderer,
  reactTsIconComponentRenderer,
} from "./constant";

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
      theme: theme ? upperFirst(theme) : undefined,
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

interface ASNGeneratorOptions {
  /**
   * 外部传入的 SVG 文件名，优先使用该字段生成 ASN identifier
   */
  name?: string;
  /**
   * 外部传入的 SVG 主题，优先使用该字段生成 ASN identifier
   */
  theme?: string;
  /**
   * 是否生成 ts 文件
   */
  typescript?: boolean;
  /**
   * 如何从 SVG 文件路径生成 name 与 theme
   */
  parser?: (id: string) => { name: string; theme: string };
  /**
   * 是否生成更多信息
   */
  verbose?: boolean;
}
export interface ASNNode {
  /**
   * 根据 name 和 theme 生成的组件名
   */
  identifier: string;
  /**
   * ASN 文件名
   */
  filename: string;
  /*
   * 生成该 ASN 的 SVG 文件路径
   */
  // SVGFilepath: string;
  /**
   * 生成该 ASN 的 SVG 文件名
   */
  name: string;
  /**
   * 生成该 ASN 的 SVG 主题
   */
  theme: string;
  /**
   * ASN 文件内容
   */
  content: string;
}
/**
 * SVG2ASN
 * @param {string} content - svg content
 * @param {string} id - svg filepath
 * @param {boolean} params.typescript
 * @returns
 */
export async function ASNNodeTransformer(
  content: string,
  id: string,
  { name: n, theme: t, typescript, parser, verbose }: ASNGeneratorOptions
): Promise<ASNNode> {
  const { name, theme } = (() => {
    if (parser) {
      return parser(id);
    }
    if (n === undefined || t === undefined) {
      return getNameAndThemeFromPath(id);
    }
    return { name: n, theme: t };
  })();

  if (verbose) {
    console.log();
    console.log(
      chalk.greenBright("[ASNNodeTransformer]before invoke svg2asn"),
      content,
      name,
      theme
    );
  }
  const asnContent = await svg2asn(content, name, theme);
  const asnFileContent = createAsnFileContent(asnContent, {
    name,
    theme,
    typescript,
  });
  const identifier = getIdentifier({ name, theme });
  if (verbose) {
    console.log();
    console.log(
      chalk.greenBright("[ASNNodeTransformer]result"),
      identifier,
      asnFileContent
    );
  }
  return {
    filename: identifier + ext(typescript),
    identifier,
    name,
    theme,
    content: asnFileContent,
  };
}

const NAME_EXPORT_TEMPLATE =
  "export { default as <%= identifier %> } from '<%= path %>';";
/**
 * generate src/index.ts file
 * @example
 * ['../asn/outlined/like']
 * export { default as LikeOutlined } from '../asn/outlined/like';
 */
export function entryRenderer<T = string>(
  files: T[],
  {
    parse,
  }: {
    parse: (file: T) => { identifier: string; path: string };
  }
) {
  const fileContent = files
    .map((file) => {
      const { identifier, path } = parse(file);
      return template(NAME_EXPORT_TEMPLATE)({ identifier, path });
    })
    .join("\n");
  return fileContent;
}

// const TYPES_FILE_CONTENT = readFileSync(
//   resolve(__dirname, "./types.ts"),
//   "utf-8"
// );
// /**
//  * 在指定路径生成类型声明文件
//  */
// export function generateTypeFiles({
//   output,
// }: {
//   output: string;
//   filename?: string;
// }) {
//   writeFileSync(resolve(output, "types.ts"), TYPES_FILE_CONTENT);
// }

// ASN 产物转换配置项
interface ASNOutputTransformerOptions {
  /**
   * SVG 文件入口
   */
  entry?: string;
  /**
   * 读取到的所有 SVG 路径与内容的列表
   */
  SVGFiles: { filepath: string; content: string }[];
  /**
   * ASN 文件输出目录
   * 如指定 /output，将会输出 /output/asn/LikeOutlined.ts 目录结构
   */
  output?: string;
  /**
   * 生成 typescript 还是 javascript 文件
   */
  typescript?: boolean;
  /**
   * 输出的 ASN 文件夹名
   * 如指定 /abc，将会输出 /output/abc/LikeOutlined.ts 目录结构
   * @default 'asn'
   */
  ASNDirName?: string;
  /**
   * 是否输出更多信息
   */
  verbose?: boolean;
}
/**
 * 批量转换 svg 文件成 js/ts 文件
 */
export async function ANSOutputTransformer({
  SVGFiles,
  typescript,
  ASNDirName,
  verbose,
}: ASNOutputTransformerOptions) {
  const ASNNodes = [];

  for (let i = 0; i < SVGFiles.length; i += 1) {
    const SVGFile = SVGFiles[i];
    const { filepath: SVGFilepath, content: SVGContent } = SVGFile;
    const ASNNode = await ASNNodeTransformer(SVGContent, SVGFilepath, {
      typescript,
      verbose,
    });
    ASNNodes.push(ASNNode);
  }

  const entryFileContent = entryRenderer(ASNNodes, {
    parse: (ASNNode) => {
      const { identifier } = ASNNode;
      return {
        identifier,
        // @TODO
        path: `./${ASNDirName || "asn"}/${identifier}`,
      };
    },
  });

  return {
    entryFile: {
      filename: `index${ext(typescript)}`,
      content: entryFileContent,
    },
    ASNNodes,
  };
}

interface ReactIconTransformerOptions
  extends Pick<
    ReactIconsOutputTransformerOptions,
    "ASNFilepath" | "typescript"
  > {
  identifier: string;
}

/**
 * 从 asn 生成单个 react icon 组件
 */
export function reactIconTransformer({
  ASNFilepath,
  identifier,
  typescript,
}: ReactIconTransformerOptions) {
  const renderer = typescript
    ? reactTsIconComponentRenderer
    : reactJsIconComponentRenderer;
  const reactIconComponentContent = renderer({
    iconsPath: ASNFilepath,
    svgIdentifier: identifier,
  });
  return {
    filename: identifier + ext(typescript, "", "x"),
    identifier,
    content: reactIconComponentContent,
  };
}

interface ReactIconsOutputTransformerOptions {
  /**
   * ASN 文件路径
   * 如 ../asn，将会生成 import LikeOutlined from '../asn/LikeOutlined'; 内容
   */
  ASNFilepath: string;
  ASNNodes: ASNNode[];
  iconsDirName?: string;
  typescript?: boolean;
}
/**
 * React Icon 组件转换器
 */
export async function reactIconsOutputTransformer({
  ASNNodes,
  ASNFilepath,
  iconsDirName,
  typescript,
}: ReactIconsOutputTransformerOptions) {
  const reactIcons = [];

  for (let i = 0; i < ASNNodes.length; i += 1) {
    const ASNNode = ASNNodes[i];
    const { identifier } = ASNNode;
    const reactIcon = reactIconTransformer({
      ASNFilepath,
      identifier,
      typescript,
    });
    reactIcons.push(reactIcon);
  }

  const entryFileContent = entryRenderer(reactIcons, {
    parse: (reactIcon) => {
      const { identifier } = reactIcon;
      return {
        identifier,
        // @TODO
        path: `./${iconsDirName || "icons"}/${identifier}`,
      };
    },
  });

  return {
    entryFile: {
      filename: `index${ext(typescript)}`,
      content: entryFileContent,
    },
    icons: reactIcons,
  };
}
