import { describe, expect, it } from 'vitest';
import { parseData } from './parser/parser.js';
import { generateMermaidCode } from './scribe.js';

describe('Flowchart diagram generation', () => {
  it('sanitizes draw.io ids and formats edge labels for Mermaid flowcharts', async () => {
    const diagram = await parseData('tests/drawio.drawio');

    expect(diagram).toBeDefined();
    if (!diagram) {
      throw new Error('Failed to parse drawio fixture');
    }

    const mermaidCode = generateMermaidCode(diagram);

    expect(mermaidCode).toMatch(/^flowchart TD/);
    expect(mermaidCode).toContain('n0F7vi46eRVVwoKnTOABEj_1@{ shape: rect, label: Rect1 }');
    expect(mermaidCode).toContain('n0F7vi46eRVVwoKnTOABEj_1 -- "connect1" -- n0F7vi46eRVVwoKnTOABEj_2');
    expect(mermaidCode).not.toContain('F7vi46eRVVwoKnTOABEj-1');
    expect(mermaidCode).not.toContain('--"connect1"--');
  });
});
