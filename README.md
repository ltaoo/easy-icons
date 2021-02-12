# icons-svg

可以将指定目录下的 `svg` 进行处理得到 `asn`。

## Usage

```js
const { gulp } = require("icons-svg");
gulp({
  entry: "",
  output: "",
});
```

会在 `output` 下输出处理好的 `svg`。

## 最终产物是什么？
首先输入是一个 `svg` 文件，并且它需要严格放在 `outlined` 和 `filled` 文件夹下，或者说文件夹名也可以是后缀名？
这里的文件夹名其实是视为了 `theme`，是哪种类型。

OK，一个 `svg` 最终其实是生产了一个 `.ts` 或者说 `.js` 文件，内容为

```js
// This icon file is generated automatically.
import { IconDefinition } from '../types';

const ActiveOutlined: IconDefinition = {
  name: 'active',
  theme: 'outlined'
  icon: {
    tag: 'svg',
    attrs: { viewBox: '64 64 896 896', focusable: 'false' },
    children: [
      {
        tag: 'path',
        attrs: {
          d: '', // 省略内容
        }
      }
    ]
  },
};

export default ActiveOutlined;
```
这其实就是一个对象，不是组件也不是啥，就是纯 `js` 对象，当然这里是有类型声明所以是 `ts` 文件。当然最后也不是直接引用这个对象？
在 `react` 项目中肯定是需要处理下，实现了一个 `IconBase` 组件，传入这个对象才能实现渲染。
那如果非框架，能否直接使用该对象呢？后面研究看看。

所以这个库的核心，就是 `svg` -> `ts`。
然后，能够附带上一些批量转换、拷贝类型声明的功能。如果有希望自己封装包的场景，也要提供方便快捷的形式，如在项目中进行配置，一键即可生成所有文件并进行发布。
