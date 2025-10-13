import { describe, expect, it } from 'vitest';
import { parseData } from './parser/parser.js';

describe('Scribe Integration Tests', () => {
  it('should parse Visio connector files without errors', async () => {
    const diagram = await parseData('tests/Connectors.vsdx');
    expect(diagram).toBeDefined();
    expect(diagram?.Shapes).toBeDefined();
  });
});
