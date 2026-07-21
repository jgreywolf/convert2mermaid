import { describe, it, expect } from 'vitest';
import { parseDiagram } from './drawioParser.js';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { deflateRawSync } from 'zlib';

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

  it('should parse compressed DrawIO files correctly', async () => {
    const mxGraphModel =
      '<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/><mxCell id="a" value="Start" style="ellipse;whiteSpace=wrap;html=1;" vertex="1" parent="1"/><mxCell id="b" value="Done" style="rounded=0;whiteSpace=wrap;html=1;" vertex="1" parent="1"/><mxCell id="e" value="go" style="endArrow=block;html=1;" edge="1" parent="1" source="a" target="b"/></root></mxGraphModel>';
    const compressed = deflateRawSync(Buffer.from(encodeURIComponent(mxGraphModel), 'utf-8')).toString('base64');
    const testFile = path.join(os.tmpdir(), `convert2mermaid-compressed-${Date.now()}.drawio`);
    fs.writeFileSync(testFile, `<mxfile><diagram>${compressed}</diagram></mxfile>`);

    try {
      const diagram = await parseDiagram(testFile);

      expect(diagram.Shapes.length).toBeGreaterThan(0);
      expect(diagram.Shapes.some((shape) => shape.IsEdge)).toBe(true);
      expect(diagram.Shapes.some((shape) => !shape.IsEdge)).toBe(true);
    } finally {
      fs.rmSync(testFile, { force: true });
    }
  });
});
