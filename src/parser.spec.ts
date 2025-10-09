import { describe, expect, it } from 'vitest';
import { parseData } from './parser.js';

describe('Parser Integration Tests', () => {
  it('should parse Visio files without errors', async () => {
    const diagram = await parseData('tests/Connectors.vsdx');
    expect(diagram).toBeDefined();
    expect(diagram?.Shapes).toBeDefined();
  });
});
