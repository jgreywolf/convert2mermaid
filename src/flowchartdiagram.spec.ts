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
    expect(mermaidCode).toContain('n0F7vi46eRVVwoKnTOABEj_1 -->|connect1| n0F7vi46eRVVwoKnTOABEj_2');
    expect(mermaidCode).not.toContain('F7vi46eRVVwoKnTOABEj-1');
    expect(mermaidCode).not.toContain('--"connect1"--');
    expect(mermaidCode).not.toContain('-- "connect1" --');
  });

  it('formats styled DrawIO edge labels without invalid Mermaid link syntax', async () => {
    const diagram = await parseData('tests/EdgesArrowsAndStyling.drawio');

    expect(diagram).toBeDefined();
    if (!diagram) {
      throw new Error('Failed to parse styled edges fixture');
    }

    const mermaidCode = generateMermaidCode(diagram);

    expect(mermaidCode).toContain('n02Qw8IFYnQMUSFGZe73MK_1 -->|Red thick edge| n02Qw8IFYnQMUSFGZe73MK_51');
    expect(mermaidCode).toContain('n02Qw8IFYnQMUSFGZe73MK_1 -->|x arrow head| n02Qw8IFYnQMUSFGZe73MK_52');
    expect(mermaidCode).toContain('n02Qw8IFYnQMUSFGZe73MK_50 -->|both direction arrows| n02Qw8IFYnQMUSFGZe73MK_54');
    expect(mermaidCode).toContain('n02Qw8IFYnQMUSFGZe73MK_50 -->|dashed line| n02Qw8IFYnQMUSFGZe73MK_52');
    expect(mermaidCode).not.toContain('-- "x arrow head" -->');
    expect(mermaidCode).not.toContain('-- "both direction arrows" -->');
    expect(mermaidCode).not.toContain('---|Red thick edge|');
    expect(mermaidCode).toContain('style n02Qw8IFYnQMUSFGZe73MK_1 stroke: #008040,fill: #f8cecc');
    expect(mermaidCode).not.toContain('light-dark(');
  });
});
