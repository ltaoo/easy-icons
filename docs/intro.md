---
title: 命令
order: 11
---

## 全量生成 asn

```bash
yarn ei create asn --svg src/svg --output src
```

该命令表示，将 `src/svg` 文件夹下所有 `svg icon` 进行处理，生成 `asn` 文件后保存至 `src/asn` 文件夹内。
并且新增 `src/index.ts`、`src/types.ts` 和 `src/helper.ts` 三个文件。

## 全量生成 react icons

```bash
yarn ei create icons --asn src/asn --output src --react
```

该命令表示，根据 `src/asn` 下存在的文件，生成对应的 `react` 组件，该组件会调用对应的 `asn` 文件。
例如存在 `src/asn/SearchOutlined.ts` 文件，则会生成 `src/icons/SearchOutlined.tsx` 文件。
并且还会改写上面生成的 `src/index.ts`。

## 拷贝 components 文件夹

```bash
yarn ei copy components --typescript --react --to src
```

该命令会在 `src` 目录下新增 `components` 文件夹与对应的 `react` 组件，上述 `src/icons/SearchOutlined.tsx` 需要调用此处拷贝的 `components/IconBase.tsx` 文件。
> 之所以这个逻辑不和 `create icons` 一起，是因为后续考虑到新增 `icon` 仍使用 `create icons` 命令，一些行为就重复了，并且如果用户修改了这里拷贝的 `components` 文件，`create icons` 还会覆盖用户的修改。

## 直接通过 svg 生成 react icons

```bash
yarn ri create icons --svg src/svg --output src
```
等于是两个命令合一。
