import { describe, it, expect } from 'vitest';
import { getFileParser } from '../../dist/parser/Parser';

describe('given a valid Visio file', () => {
  it('should parse with no errors', async () => {
    const vsdxFilePath = 'src/tests/Drawing.vsdx';

    const parser = getFileParser(vsdxFilePath);
    const pages = await parser.parseDiagram();
    expect(pages.length).toBe(1);
  });

  it('should parse all shapes', async () => {
    const vsdxFilePath = 'src/tests/Drawing.vsdx';

    const parser = getFileParser(vsdxFilePath);
    const pages = await parser.parseDiagram();
    expect(pages[0].Shapes.length).toBe(3);
    expect(pages[0].Shapes[0].Name).toBe('Decision');
  });
});
