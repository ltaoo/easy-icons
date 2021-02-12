# e-icons
`e-icons` 是一个能让使用自己的 `svg icon` 就像使用 `@ant-design/icons` 体验一样的工具。

本项目核心逻辑参考自 `@ant-design/icons`，将其改写为一个能在任意项目中使用的包。核心逻辑就是将 `svg` 文件解析为 `js` 对象，并提供 `React` 组件可直接使用该 `js` 对象渲染图标。

本项目分几种使用方式
1、将 svg 作为单个 npm 包发布后使用
2、将 svg 作为多个 npm 包发布后使用（`@ant-design/icon` 就是如此，好处是多框架复用，不局限于 `react`)
3、在项目中直接使用
4、在 umi 项目中使用

## 1、将 svg 作为单个 npm 包发布后使用
首先新建一个项目文件夹

```bash
mkdir icons-example
cd icons-example
npm init -y
```
> `icons-example` 会作为包名使用

安装依赖

```bash
yarn add e-icons -D
```

将自己的 `svg` 图标放入项目中。目录结构必须符合

```
- src
    - svg
        - filled
        - outlined
        - twotone
package.json
```

`svg` 图标按照类型放入这三个文件夹中。

然后在项目根目录下，使用命令 `yarn ei asn src/svg --output src`，将在 `src` 文件夹下新增 `asn` 和 `index.ts` 等文件。
再使用 `yarn ei icons --output src`，将在 `src` 目录下新增 `components`、`icons` 等目录。
至此，项目就完成了，接下来需要将这个项目打包后发布，才能使用。

```bash
yarn add @types/react @types/classnames father-build -D
yarn add @ant-design/colors
yarn add react classnames --peer
```
> `yarn add react classnames --peer` 需要在最后执行

增加 `.fatherrc.ts` 配置

```typescript
export default {
  cjs: {
    type: "babel",
  },
  esm: {
    type: "babel",
  },
};
```

然后打包，打包完成发布即可使用。
```bash
yarn father-build
```

```bash
npm publish
```

> 可以在发布前本地 `link` 调试，确认可以使用后再发包。

## 2、将 svg 作为多个 npm 包发布后使用
在不同包中执行不同命令。

## 3、仅在项目中使用
> 必须是 `ts` 项目，否则还是建议发成 `npm` 包后使用。

和之前步骤类似，找一个目录存放 `svg/outlined` 等文件夹，以如下目录结构为例

依次执行

```bash

```

然后直接引用即可。

## 4、在 umi 项目中使用
可使用插件

## Nodejs API


## faq
### 如何实现按需加载
使用 `babel-plugin-import` 插件，并配置
