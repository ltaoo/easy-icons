import { writeFileSync } from "fs";
import { resolve, parse, dirname } from "path";

import template from "lodash.template";
import vfs from "vinyl-fs";
import globby from "globby";

import { ensure, checkIsNpmPackage } from "./utils";
import { ICON_TEMPLATE, r } from "./constant";

const cwd = process.cwd();

/**
 * 从指定路径读取所有的 asn 文件
 * @param asnPath
 * @returns
 */
function getAllAsn(asnPath: string): Promise<string[]> {
  return new Promise((res) => {
    if (checkIsNpmPackage(asnPath)) {
      import(asnPath).then((module) => {
        // console.log(module);
        const allAsn: string[] = Object.keys(module);
        res(allAsn);
      });
      return;
    }
    const allAsn: string[] = globby.sync([resolve(asnPath, "**.ts")]);
    // res(allAsn.map((asnFilepath) => parse(asnFilepath).name));
    const result = allAsn.map((asnFilepath) => {
      return parse(String(asnFilepath)).name;
    });
    // res(allAsn.map((asnFilepath) => parse(asnFilepath).name));
    res(result);
  });
}

/**
 * 创建 icon 组件文件
 */
export async function generateIconFiles({
  iconsPath, // iconsPath 就是 asnPath，两个其实是同一个东西
  output,
  asnPath,
}: {
  iconsPath: string;
  asnPath: string;
  output: string;
}) {
  const allAsn = await getAllAsn(asnPath);
  allAsn.forEach((svgIdentifier) => {
    const render = template(ICON_TEMPLATE);
    const nextContent = render({
      svgIdentifier,
      iconsPath,
    });
    const iconFilepath = resolve(output, "icons", `${svgIdentifier}.tsx`);
    ensure(dirname(iconFilepath));
    writeFileSync(iconFilepath, nextContent);
  });
  return allAsn;
}

/**
 * generate src/index.ts file
 */
export async function generateEntry({
  output,
  asnPath,
  render,
  filepath,
}: {
  output: string;
  asnPath: string;
  filepath?: string;
  render: (svgIdentifier: string) => { identifier: string; path: string };
}) {
  if (asnPath === undefined) {
    return Promise.reject(new Error(`asnPath can't be undefined.`));
  }
  const filename = filepath || resolve(output, "index.ts");
  const allAsn = await getAllAsn(asnPath);
  const renderTemplate =
    "export { default as <%= identifier %> } from '<%= path %>';";
  const fileContent = allAsn
    .map((asn) => {
      const { identifier, path } = render(asn);
      const content = template(renderTemplate)({ identifier, path });
      return content;
    })
    .join("\n");

  ensure(dirname(filename));
  writeFileSync(filename, fileContent);
}

/**
 * 根据 icons 生成一个文件
 * 它会从 output/asn 下找到所有 ts 文件，并使用路径来渲染内容
 * @todo 它可以拆分成两个方法，一个单纯用来创建文件，一个用来读取 asn 后根据 asn 创建文件
 * @param {function} fn - 如何根据 filepath 生成 identifier 和 path，这两个值将被渲染到文件中
 * @param {string} output - 文件生成的路径
 * @param {any[]} opts.cachedFiles - 使用指定的文件进行生成，而不去查找 asn 目录下的所有 ts 文件
 * @param {string} opts.filename - 生成的文件名，如果传了该值，则可以自己指定生成的文件名，不自动生成为 output/index.ts
 * @param {string} opts.content - 生成的文件内容，如果传了该值，则可以不根据模板渲染，而是强制使用该值
 * @param {string} opts.templateContent - 渲染模板
 */
export function generateFile(
  fn: (filepath: string) => { identifier: string; path: string },
  {
    filepaths,
    filename,
    output,
    content: forceContent,
    template: t = "export { default as <%= identifier %> } from '<%= path %>';",
  }: {
    filepaths?: any[];
    content?: string;
    filename?: string;
    output?: string;
    template?: string;
  } = {}
) {
  return new Promise((res, reject) => {
    const files = filepaths || globby.sync(resolve(output, "asn", "*.ts"));
    // console.log('[]generateEntry - collected files', output, files);
    const content =
      forceContent ||
      files
        .map((filepath: any) => {
          const params = fn(filepath);
          if (params.identifier === undefined || params.path === undefined) {
            throw new Error("identifier or path can't be undefined");
          }
          return template(t)(params);
        })
        .join("\n");

    const name = filename || resolve(output, "index.ts");
    ensure(dirname(name));
    writeFileSync(name, content);
    res(name);
  });
}

/**
 * 将项目内的某些文件拷贝到指定目录
 * @param {string} patterns - 需要拷贝的文件，相对 lib/es 目录，不是 src 目录需要注意下
 * @param {string} to - 拷贝到的目录，相对于执行该命令的目录
 */
export function copyFiles(patterns: string, to: string) {
  vfs.src(`${r()}/${patterns}`).pipe(vfs.dest(to));
}
