import { describe, expect, it } from 'vitest';
import { parseData } from './parser/parser.js';
import { generateMermaidCode } from './scribe.js';

describe('Component diagram generation', () => {
  it('generates Mermaid block syntax without empty labels or flowchart edge labels', async () => {
    const diagram = await parseData('tests/ComponentDiagram.drawio');

    expect(diagram).toBeDefined();
    if (!diagram) {
      throw new Error('Failed to parse component diagram fixture');
    }

    const mermaidCode = generateMermaidCode(diagram);

    expect(mermaidCode).toMatch(/^block-beta/);
    expect(mermaidCode).not.toContain('[""]');
    expect(mermaidCode).not.toContain(': uses');
    expect(mermaidCode).toContain('n0comp1 -- "uses" --> n0comp2');
    expect(mermaidCode).toContain('n0comp1 --> n0int1');
  });
});
