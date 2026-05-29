import { describe, expect, it } from 'vitest';
import { convertToMermaid, parseDiagram } from './index.js';
import { DiagramType } from './detection/types.js';

describe('Public API', () => {
  it('converts an input file to Mermaid syntax for library consumers', async () => {
    const result = await convertToMermaid('tests/drawio.drawio');

    expect(result.mermaid).toMatch(/^flowchart TD/);
    expect(result.analysis?.detectedType).toBe(DiagramType.FLOWCHART);
    expect(result.diagram.Shapes.length).toBeGreaterThan(0);
  });

  it('wraps Mermaid syntax when md output is requested', async () => {
    const result = await convertToMermaid('tests/drawio.drawio', { outputFormat: 'md' });

    expect(result.mermaid).toMatch(/^```mermaid\n/);
    expect(result.mermaid).toMatch(/\n```\n$/);
  });

  it('parses diagrams without generating Mermaid code', async () => {
    const diagram = await parseDiagram('tests/drawio.drawio');

    expect(diagram).toBeDefined();
    expect(diagram?.Analysis?.detectedType).toBe(DiagramType.FLOWCHART);
  });
});
