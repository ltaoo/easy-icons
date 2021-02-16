# e-icons
`e-icons` 是一个能让使用自己的 `svg icon` 就像使用 `@ant-design/icons` 的工具。

本项目核心逻辑参考自 `@ant-design/icons`，将其改写为一个能在任意项目中使用的包。核心逻辑就是将 `svg` 文件解析为 `js` 对象，并提供 `React` 组件可直接使用该 `js` 对象渲染图标。

本项目分几种使用方式
1. 将 svg 作为单个 npm 包发布后使用
2. 将 svg 作为多个 npm 包发布后使用（`@ant-design/icon` 就是如此，好处是多框架复用，不局限于 `react`)
3. 在项目中直接使用
4. 在 umi 项目中使用

下面详细说明各种使用方式

## 1、将 svg 作为单个 npm 包发布后使用
```bash
yarn create easy-icons ./my-icons
```

```bash
cd my-icons
yarn
```

将自己的 `svg` 图标按主题放入项目 `svg` 下的主题文件夹中。

```
- svg
  - filled 填充类型的图标
  - outlined 线性图标
  - twotone 颜色图标
```

执行命令 `npm publish` 即可发布到 `npm` 上。之后有新增 `svg icon` 也是直接 `npm publish` 发布即可。

## 2、将 svg 作为多个 npm 包发布后使用（todo）
在不同包中执行不同命令。

## 3、仅在项目中使用
> 必须是 `ts` 项目，否则还是建议发成 `npm` 包后使用。

和之前步骤类似，找一个目录存放 `svg`、`outlined` 等文件夹，以如下目录结构为例

```bash
- package.json
- src
  - svg
    - filled
    - outlined
  - icons
```

依次执行

```bash
yarn ei gen all --svg src/svg --output src/icons
```

然后在项目中引用即可。

```typescript
// src/App.tsx
const { SmileOutlined } from '@/icons';
```

## 4、在 umi 项目中使用（todo）
可使用插件

## todo

[] 支持 vue 项目
[] 支持在非 ts 项目中直接使用
[] 优化 bin 目录下代码
[] 实现 umi 插件供在 umi 项目中快捷使用
[] verbose 参数打印调试信息

## Nodejs API
见 `example/api/index.js`。

## faq

### 新增一个 icon 要怎么做
目前没有增量新增或指定新增 `icon` 功能，每次都是全量处理，所以和初始化流程相同

```bash
yarn gen all --svg <svg-dir> --output <output-dir>
```

### 如何实现按需加载
使用 `babel-plugin-import` 插件，并配置
