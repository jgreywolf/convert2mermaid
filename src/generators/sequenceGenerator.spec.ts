import { describe, expect, it } from 'vitest';
import { parseData } from '../parser/parser.js';
import { generateMermaidCode } from '../scribe.js';

describe('Sequence diagram generation', () => {
  it('maps unlabeled DrawIO lifelines to their labeled participants', async () => {
    const diagram = await parseData('tests/SequenceDiagram.drawio');

    expect(diagram).toBeDefined();
    if (!diagram) {
      throw new Error('Failed to parse sequence fixture');
    }

    const mermaidCode = generateMermaidCode(diagram);

    expect(mermaidCode).toContain('participant U as User');
    expect(mermaidCode).toContain('participant S as System');
    expect(mermaidCode).toContain('participant D as Database');
    expect(mermaidCode).toContain('U->S: login(credentials)');
    expect(mermaidCode).toContain('S->D: validateUser()');
    expect(mermaidCode).toContain('D-->S: userValid');
    expect(mermaidCode).toContain('S-->U: loginSuccess');
    expect(mermaidCode).not.toContain('lifeline1');
    expect(mermaidCode).not.toContain('lifeline2');
    expect(mermaidCode).not.toContain('lifeline3');
  });

  it('uses LF line endings and maps activation boxes to participant aliases', async () => {
    const diagram = await parseData('tests/sequence_kanban_board.drawio');

    expect(diagram).toBeDefined();
    if (!diagram) {
      throw new Error('Failed to parse sequence fixture');
    }

    const mermaidCode = generateMermaidCode(diagram);
    const firstLine = mermaidCode.split('\n')[0];

    expect(firstLine).toBe('sequenceDiagram');
    expect(firstLine).not.toContain('\r');
    expect(mermaidCode).toContain('BU->C: PATCH /cards/C {listId B, position k}');
    expect(mermaidCode).toContain('C->DR: beginTx()');
    expect(mermaidCode).toContain('BU->L: PATCH /lists/B {position p}');
    expect(mermaidCode).toContain('L->DR: beginTx()');
    expect(mermaidCode).not.toContain('NXixKWQb8D9G6zKyUQPl-6');
    expect(mermaidCode).not.toContain('NXixKWQb8D9G6zKyUQPl-8');
  });
});
