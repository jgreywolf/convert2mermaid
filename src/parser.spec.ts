import { describe, it, expect } from 'vitest';
import { Parser } from './Parser';


describe('isRaw', () => {
  it('should return true for raw paths', async() => {
      const vsdxFilePath = 'src/Drawing.vsdx';
    
      const parser = new Parser(vsdxFilePath);
    
      await parser.parse();
      const pages = parser.getPages();
      expect(pages.length).toBe(1);
  });
});
