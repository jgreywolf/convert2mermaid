import { describe, it, expect } from 'vitest';
import { Parser } from '../Parser';

describe('given a valid Visio file', () => {
  it('should parse with no errors', async () => {
    const vsdxFilePath = 'src/tests/Drawing.vsdx';

    const parser = new Parser(vsdxFilePath);

    const pages = await parser.parse();
    expect(pages.length).toBe(1);
  });

  it('should parse all shapes', async () => {
    const vsdxFilePath = 'src/tests/Drawing.vsdx';

    const parser = new Parser(vsdxFilePath);

    const pages = await parser.parse();
    expect(pages[0].Shapes.length).toBe(3);
    expect(pages[0].Shapes[0].Name).toBe('Decision');
  });
});
