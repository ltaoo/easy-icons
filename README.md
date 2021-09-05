# easy-icons

`easy-icons` 是一个能使用 `svg icon` 就像使用 `@ant-design/icons` 一样的工具。

> 本项目核心逻辑参考自 `@ant-design/icons`，将其改写为一个能在任意项目中使用的包。
> 核心逻辑就是将 `svg` 文件解析为 `js` 对象，并提供 `React` 组件可直接使用该 `js` 对象渲染图标。

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

## 4、在 umi 项目中使用

使用 `umi-plugin-icons` 插件即可。

## faq

### 新增一个 icon 要怎么做

目前没有增量新增或指定新增 `icon` 功能，每次都是全量处理，所以和初始化流程相同

```bash
yarn gen all --svg <svg-dir> --output <output-dir>
```

### 如何实现按需加载

使用 `babel-plugin-import` 插件，并配置

```js
 {
  libraryName: '@icons',
  libraryDirectory: 'icons',
  camel2DashComponentName: false,
},
```

## 原理说明

现在有一个 `svg` 图标，使用编辑器打开查看，它的的内容是这样的（省去了路径的一些信息，标签结构是这样的）

```xml
<?xml version="1.0" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 1024 1024">
  <path d="M885.9 533.  .....     2.1-19.6 43z"/>
</svg>
```

将其作为字符串读取并使用 `SVGO` 解析、处理，偏向「清理」这种行为，对属性排序、移除不必要的属性等等。

```js
const svg = '<?xml version="1.0" ...>';
const optimizer = new SVGO({
  floatPrecision: 2,
  // 通过 plugins 来对内容进行修改，支持自定义 plugin
  plugins: [],
});
const { data } = await optimizer.optimize(svg);
```

处理得到的 `data` 还是字符串，但移除掉了一些无关信息，如 `class`、`fill` 等属性。

接下来就是重点，根据「清理」后的 `svg` 字符串，生成 `asn`，类似这样

```js
{
  "tag": "svg",
  "attrs": { "viewBox": "0 0 1024 1024", "focusable": "false" },
  "children": [
    {
      "tag": "path",
      "attrs": {
        "d": "..."
      }
    }
  ]
}
```

再生成一个 `asn.ts` 文件，里面会导出上述对象，这样一个文件就可以供组件调用。

```js
// React Icon component
import * as React from 'react';
import LikeOutlinedSvg from './asn/LikeOutlined.ts';
import AntdIcon, { AntdIconProps } from '../components/AntdIcon';

const LikeOutlined = (
  props: AntdIconProps,
  ref: React.ForwardedRef<HTMLSpanElement>,
) => <AntdIcon {...props} ref={ref} icon={LikeOutlinedSvg} />;

LikeOutlined.displayName = 'LikeOutlined';
export default React.forwardRef<HTMLSpanElement, AntdIconProps>(LikeOutlined);
```

这个组件可以直接在项目中使用。

当然，上面所有流程都会由本项目完成，用户只需要直接使用 `<LikeOutlined />` 即可在页面中渲染一个点赞按钮。
