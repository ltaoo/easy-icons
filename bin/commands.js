const path = require('path');

const del = require('del');
const chalk = require('chalk');

const {
    generateAsnFiles,
    generateIconFiles,
    generatePreviewPage,
    copyFiles,
    generateEntry,
    getOutput,
  } = require("../lib");
const { statSync } = require('fs');
/**
 * 清除生成的文件
 */
function clean() {
    const output = getOutput();
    if (output === undefined) {
        return;
    }
    del([`${output}/**/*`], {
        force: true,
    });
    console.log('clean success~');
}

module.exports.clean = clean;

async function generateAsn({ svg, output }) {
    // console.log('[BIN]generateAsn - start', svg, output);
    await generateAsnFiles({
        svg,
        output,
    });
    generateEntry((filepath) => {
        const { name } = path.parse(filepath);
        return {
            identifier: name,
            path: `./asn/${name}`,
        };
    });
    copyFiles("types/**.ts", output);
    console.log(chalk.green('success'), '生成 asn 文件成功');
}
module.exports.generateAsn = generateAsn;

async function generateIcons() {
    await generateIconFiles({
        iconsPath: "../asn",
    });
    const output = getOutput();
    generateEntry((filepath) => {
        const { name } = path.parse(filepath);
        return {
            identifier: name,
            path: `./${name}`,
        };
    }, { filename: path.resolve(output, 'icons', "./index.ts") });
    try {
        statSync(path.resolve(output, 'components'));
    } catch (err) {
        // ...
        copyComponents();
    }
    console.log(chalk.green('success'), '生成 icon 文件成功');
    generateEntry(
        () => { },
        { content: "export * from './icons'" }
    );
}
module.exports.generateIcons = generateIcons;

function copyComponents() {
    const output = getOutput();
    copyFiles("components/**/*", path.resolve(output, "components"));
    console.log(chalk.green('success'), '拷贝 components 文件成功');
}
module.exports.copyComponents = copyComponents;

/**
 * 根据 git 增量处理生成 icon
 */
function addIcons() {

}

/**
 * 生成预览文件
 */
function generatePreview(opts) {
    generatePreviewPage(opts);
}
module.exports.generatePreview = generatePreview;
