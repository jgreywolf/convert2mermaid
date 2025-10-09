import { beforeAll, describe, expect, it } from 'vitest';
// import { generateMermaidCode } from './scribe';
// import { Diagram } from './types';
import { parseData } from './parser.js';

describe('given a selection of Visio shape data', () => {
  it('should translate flowchart shapes', async () => {
    const diagram = await parseData('tests/Connectors.vsdx');
  });
});
