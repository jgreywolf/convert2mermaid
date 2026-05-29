# convert2mermaid

[![npm version](https://img.shields.io/npm/v/convert2mermaid.svg)](https://www.npmjs.com/package/convert2mermaid)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

<p align="center">
  <a href="README.md">English</a> |
  <a href="README.zh.md">简体中文</a>
</p>

将 Visio、DrawIO、Excalidraw、PlantUML 等格式的图转换为 Mermaid 语法。既可以作为命令行工具使用，也可以作为 npm 包在其他模块中引入。

## 功能特性

- 支持 `.vsdx`、`.drawio`、`.excalidraw`、`.puml`、`.plantuml`
- 可生成 `flowchart`、`classDiagram`、`sequenceDiagram`、`stateDiagram-v2`、`block-beta`、`erDiagram` 等 Mermaid 语法
- 自动检测图类型，并提供置信度
- DrawIO 专用图类型置信度较低时，可自动回退为 `flowchart`
- 尽量保留标签、常见形状、颜色、线型和箭头
- 同时提供 CLI 和库 API
- 提供 TypeScript 类型声明

## 安装

```bash
npm install convert2mermaid
```

本地开发：

```bash
git clone https://github.com/jgreywolf/convert2mermaid.git
cd convert2mermaid
npm install
npm run build
```

## 命令行用法

全局安装或作为构建后的包使用：

```bash
convert2mermaid -i input.drawio -o output.mmd
```

在本仓库中使用：

```bash
# 运行构建后的 CLI
npm start -- -i tests/drawio.drawio -f mmd

# 开发时直接运行 TypeScript 源码
npm run dev -- -i tests/drawio.drawio -f md
```

### CLI 参数

```text
-i, --inputFile <path>                 输入图文件
-o, --outputFile <path>                输出文件路径
-f, --outputFormat <mmd|md>            输出格式，默认 mmd
-d, --diagramType <type>               预留参数，用于显式图类型
-ffc, --fallbackFlowchartConfidence    DrawIO 回退阈值，默认 50
```

`-ffc` 用于控制 DrawIO 检测。当某个专用图类型的置信度低于该百分比时，会回退为 `flowchart`，因为 Mermaid 的 flowchart 是最宽容、最容易渲染成功的目标格式。

示例：

```bash
convert2mermaid -i diagram.drawio -o diagram.mmd -ffc 70
```

## 作为 npm 包使用

```ts
import { convertToMermaid, parseDiagram } from 'convert2mermaid';

const result = await convertToMermaid('diagram.drawio', {
  outputFormat: 'mmd',
  fallbackFlowchartConfidence: 50,
});

console.log(result.mermaid);
console.log(result.analysis?.detectedType);

const parsed = await parseDiagram('diagram.drawio');
```

### API

#### `convertToMermaid(filepath, options?)`

解析源文件并返回 Mermaid 输出。

```ts
const result = await convertToMermaid('diagram.puml', {
  outputFormat: 'md',
});
```

返回值：

```ts
{
  diagram: Diagram;
  mermaid: string;
  analysis?: DiagramAnalysis;
}
```

#### `parseDiagram(filepath, options?)`

只解析源文件，返回内部图模型，不生成 Mermaid。

#### `generateMermaidCode(diagram)`

基于已经解析好的图模型生成 Mermaid 语法。

## 支持格式

### DrawIO `.drawio`

支持的目标类型包括：

- 流程图
- 类图
- 序列图
- 状态图
- 组件图
- 实体关系图
- 网络图

DrawIO 检测基于结构化的 `mxCell` 字段，例如标签、样式、边、形状提示等。有些 DrawIO 形状语义比较明确，例如 `umlActor`、`umlLifeline`、`startState`、`endState`、`module`、Cisco 形状等。普通矩形、椭圆、圆角矩形和箭头没有明确语义，因此会保守处理；专用图类型置信度较低时会回退为 `flowchart`。

### PlantUML `.puml`、`.plantuml`

支持常见的 PlantUML 类图、组件图、状态图、序列图、活动图、用例图和基础甘特图输入。

### Visio `.vsdx`

支持基础形状和连接线转换，主要输出为 Mermaid flowchart。

### Excalidraw `.excalidraw`

支持基础形状、连接线、标签和流程图风格输出。

## 输出格式

- `.mmd`：纯 Mermaid 语法
- `.md`：带 Mermaid 代码块的 Markdown

## 示例

```bash
# DrawIO 转纯 Mermaid
convert2mermaid -i architecture.drawio -o architecture.mmd

# PlantUML 转 Markdown
convert2mermaid -i class-model.puml -o class-model.md -f md

# 提高 DrawIO 专用图类型检测阈值
convert2mermaid -i component.drawio -o component.mmd -ffc 80
```

## 开发

```bash
npm install
npm run build
npm test
npm run dev -- -i tests/drawio.drawio
```

`npm pack` 和 `npm publish` 会通过 `prepack` 脚本先执行 `npm run build`。

## 项目结构

```text
src/
  index.ts              npm 包公共导出
  cli.ts                命令行入口
  api.ts                库 API
  parser/               各格式解析器
  generators/           Mermaid 生成器
  detection/            图类型检测
  utils/                通用工具
  shapes/               形状映射
```

## 已知限制

- DrawIO 文件并不总是包含明确的图类型元数据，检测仍然是启发式的。
- 普通 DrawIO 形状会保守处理，通常回退为 flowchart。
- 暂不完整支持多页图。
- 复杂 PlantUML 特性可能需要转换后手动调整。
- Mermaid 的布局方式和源工具不同，因此无法保证完全保留原图位置。

## 许可证

MIT。详见 [LICENSE](LICENSE)。

