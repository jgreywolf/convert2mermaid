import { describe, it, expect } from 'vitest';
import { parseDiagram } from './drawioParser.js';
import * as fs from 'fs';

describe('DrawIO Parser', () => {
  it('should parse DrawIO files correctly', async () => {
    const testFile = 'tests/drawio.drawio';

    if (fs.existsSync(testFile)) {
      const diagram = await parseDiagram(testFile);

      expect(diagram).toBeDefined();
      expect(diagram.Shapes).toBeDefined();
      expect(Array.isArray(diagram.Shapes)).toBe(true);

      // Should have at least one shape
      expect(diagram.Shapes.length).toBeGreaterThan(0);

      // Check that shapes have required properties
      diagram.Shapes.forEach((shape) => {
        expect(shape.Id).toBeDefined();
        expect(shape.ShapeType).toBeDefined();
        expect(shape.Style).toBeDefined();
        expect(typeof shape.IsEdge).toBe('boolean');
      });
    } else {
      console.warn('DrawIO test file not found, skipping test');
    }
  });
});
