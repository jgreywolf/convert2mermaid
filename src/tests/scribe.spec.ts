import { describe, it, expect, beforeAll } from 'vitest';
import { Scribe } from '../Scribe';
import { Parser } from '../Parser';

let parser: Parser;
let scribe: Scribe;

describe('given a selection of Visio shape data', () => {
  // beforeAll(async () => {
  //   const vsdxFilePath = 'src/tests/Drawing.vsdx';
  //   parser = new Parser(vsdxFilePath);
  //   await parser.parse();
  //   scribe = new Scribe();
  // });

  it('should translate flowchart shapes', async () => {
    scribe = new Scribe();
    const vsdxFilePath = 'src/tests/FlowchartShapes.vsdx';
    parser = new Parser(vsdxFilePath);
    const pages = await parser.parse();

    const mermaidSyntax = scribe.writeMermaidCode(pages[0]);
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
    scribe = new Scribe();
    const vsdxFilePath = 'src/tests/BasicShapes.vsdx';
    parser = new Parser(vsdxFilePath);
    const pages = await parser.parse();

    const mermaidSyntax = scribe.writeMermaidCode(pages[0]);
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
    scribe = new Scribe();
    const vsdxFilePath = 'src/tests/Connectors.vsdx';
    parser = new Parser(vsdxFilePath);
    const pages = await parser.parse();

    const mermaidSyntax = scribe.writeMermaidCode(pages[0]);
    expect(mermaidSyntax).toContain(`flowchart TD
n040@{ shape: rect, label: '' }
n041@{ shape: rect, label: '' }
n040 --> n041`);
  });
});
