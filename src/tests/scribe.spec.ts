import { describe, it, expect, beforeAll } from 'vitest';
import { Scribe, writeMermaidCode } from '../Scribe';
import { getFileParser, Parser } from '../../dist/parser/Parser';

describe('given a selection of Visio shape data', () => {
  it('should translate flowchart shapes', async () => {
    const vsdxFilePath = 'src/tests/FlowchartShapes.vsdx';
    const parser = getFileParser(vsdxFilePath);
    const pages = await parser.parseDiagram();

    const mermaidSyntax = writeMermaidCode(pages[0]);
    expect(mermaidSyntax).toContain(`flowchart TD
n027@{ shape: rect, label: '' }
n028@{ shape: diam, label: '' }
n029@{ shape: fr-rect, label: '' }
n030@{ shape: stadium, label: '' }
n031@{ shape: doc, label: '' }
n032@{ shape: lean-r, label: '' }
n033@{ shape: cyl, label: '' }
n034@{ shape: bow-rect, label: '' }
n035@{ shape: rect, label: '' }
n036@{ shape: notch-rect, label: '' }
n037@{ shape: rect, label: '' }
n039@{ shape: sm-circ, label: '' }`);
  });

  it('should translate basic shapes', async () => {
    const vsdxFilePath = 'src/tests/BasicShapes.vsdx';
    const parser = getFileParser(vsdxFilePath);
    const pages = await parser.parseDiagram();

    const mermaidSyntax = writeMermaidCode(pages[0]);
    expect(mermaidSyntax).toContain(`flowchart TD
n012@{ shape: rect, label: '' }
n013@{ shape: rect, label: '' }
n014@{ shape: circ, label: '' }
n016@{ shape: tri, label: '' }
n017@{ shape: hex, label: '' }
n018@{ shape: cyl, label: '' }
n020@{ shape: lean-r, label: '' }
n021@{ shape: trap-b, label: '' }
n022@{ shape: diam, label: '' }
n023@{ shape: rounded, label: '' }
n024@{ shape: circ, label: '' }
n025@{ shape: brace, label: '' }
n026@{ shape: brace-r, label: '' }`);
  });

  it('should write edges', async () => {
    const vsdxFilePath = 'src/tests/Connectors.vsdx';
    const parser = getFileParser(vsdxFilePath);
    const pages = await parser.parseDiagram();

    const mermaidSyntax = writeMermaidCode(pages[0]);
    expect(mermaidSyntax).toContain(`flowchart TD
n040@{ shape: rect, label: '' }
n041@{ shape: rect, label: '' }
n040 --> n041`);
  });

  it('should write style statements', async () => {
    const vsdxFilePath = 'src/tests/DiagramWithStyles.vsdx';
    const parser = getFileParser(vsdxFilePath);
    const pages = await parser.parseDiagram();

    const mermaidSyntax = writeMermaidCode(pages[0]);
    expect(mermaidSyntax).toContain(`flowchart TD
n01@{ shape: rect, label: Rect 1 }
n02@{ shape: rect, label: Rect 2 }
n02 -- connect 1 --> n01
style n01 fill: #7f7f7f,stroke: #c05046
linkStyle 0 stroke: #c05046`);
  });
});
