# convert2mermaid

[![npm version](https://img.shields.io/npm/v/convert2mermaid.svg)](https://www.npmjs.com/package/convert2mermaid)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

<p align="center">
  <a href="README.md">English</a> |
  <a href="README.zh.md">简体中文</a>
</p>

Convert diagrams from Visio, DrawIO, Excalidraw, and PlantUML into Mermaid syntax. It can be used as a command-line tool or imported as an npm package.

## Features

- Supports `.vsdx`, `.drawio`, `.excalidraw`, `.puml`, and `.plantuml`
- Generates Mermaid syntax such as `flowchart`, `classDiagram`, `sequenceDiagram`, `stateDiagram-v2`, `block-beta`, and `erDiagram`
- Detects diagram types with confidence scores
- Falls back DrawIO diagrams to `flowchart` when specialized detection confidence is low
- Preserves labels, common shapes, colors, line styles, and arrows where possible
- Provides both CLI and library APIs
- Ships TypeScript declarations

## Installation

```bash
npm install convert2mermaid
```

For local development:

```bash
git clone https://github.com/jgreywolf/convert2mermaid.git
cd convert2mermaid
npm install
npm run build
```

## Command Line Usage

After installing globally or using the built package:

```bash
convert2mermaid -i input.drawio -o output.mmd
```

From this repository:

```bash
# Run built CLI
npm start -- -i tests/drawio.drawio -f mmd

# Run TypeScript source during development
npm run dev -- -i tests/drawio.drawio -f md
```

### CLI Options

```text
-i, --inputFile <path>                 Input diagram file
-o, --outputFile <path>                Output file path
-f, --outputFormat <mmd|md>            Output format, defaults to mmd
-d, --diagramType <type>               Reserved for explicit diagram type usage
-ffc, --fallbackFlowchartConfidence    DrawIO fallback threshold, defaults to 50
```

`-ffc` controls DrawIO detection. If a specialized DrawIO type is detected below this confidence percentage, the converter uses `flowchart` instead because Mermaid flowcharts are the most tolerant target.

Example:

```bash
convert2mermaid -i diagram.drawio -o diagram.mmd -ffc 70
```

## Library Usage

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

Parses a source file and returns Mermaid output.

```ts
const result = await convertToMermaid('diagram.puml', {
  outputFormat: 'md',
});
```

Returns:

```ts
{
  diagram: Diagram;
  mermaid: string;
  analysis?: DiagramAnalysis;
}
```

#### `parseDiagram(filepath, options?)`

Parses a source file and returns the internal diagram model without generating Mermaid.

#### `generateMermaidCode(diagram)`

Generates Mermaid syntax from an already parsed diagram object.

## Supported Formats

### DrawIO `.drawio`

Supported targets include:

- Flowcharts
- Class diagrams
- Sequence diagrams
- State diagrams
- Component diagrams
- Entity-relationship diagrams
- Network diagrams

DrawIO detection is based on structured `mxCell` fields such as labels, styles, edges, and shape hints. Some DrawIO shapes are semantically explicit, for example `umlActor`, `umlLifeline`, `startState`, `endState`, `module`, and Cisco shapes. Generic shapes such as rectangles, ellipses, rounded rectangles, and arrows are ambiguous, so low-confidence specialized detections fall back to `flowchart`.

### PlantUML `.puml`, `.plantuml`

Supports common PlantUML class, component, state, sequence, activity, use case, and basic Gantt-style inputs.

### Visio `.vsdx`

Supports basic shape and connector conversion, mostly as Mermaid flowcharts.

### Excalidraw `.excalidraw`

Supports basic shapes, connectors, labels, and flowchart-style output.

## Output Formats

- `.mmd`: raw Mermaid syntax
- `.md`: Markdown with a Mermaid fenced code block

## Examples

```bash
# DrawIO to raw Mermaid
convert2mermaid -i architecture.drawio -o architecture.mmd

# PlantUML to Markdown
convert2mermaid -i class-model.puml -o class-model.md -f md

# Stricter DrawIO specialized detection
convert2mermaid -i component.drawio -o component.mmd -ffc 80
```

## Development

```bash
npm install
npm run build
npm test
npm run dev -- -i tests/drawio.drawio
```

`npm pack` and `npm publish` run `npm run build` first through the `prepack` script.

## Project Structure

```text
src/
  index.ts              Public package exports
  cli.ts                Command-line entry
  api.ts                Library API
  parser/               Format parsers
  generators/           Mermaid generators
  detection/            Diagram type detection
  utils/                Shared helpers
  shapes/               Shape mappings
```

## Known Limitations

- DrawIO diagrams do not always contain semantic diagram type metadata. Detection is heuristic.
- Generic DrawIO shapes are intentionally treated conservatively and often fall back to flowchart.
- Multi-page diagrams are not fully supported.
- Complex PlantUML features may need manual adjustment after conversion.
- Mermaid has different layout behavior from source tools, so output may not preserve exact positions.

## License

MIT. See [LICENSE](LICENSE).

