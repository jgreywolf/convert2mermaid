import { describe, expect, it } from 'vitest';
import { parseData } from './parser.js';

describe('Parser Integration Tests', () => {
  it('should parse Visio files (.vsdx)', async () => {
    const diagram = await parseData('tests/Connectors.vsdx');
    expect(diagram).toBeDefined();
    expect(diagram?.Shapes).toBeDefined();
  });

  it('should parse DrawIO files (.drawio)', async () => {
    const diagram = await parseData('tests/drawio.drawio');
    expect(diagram).toBeDefined();
    expect(diagram?.Shapes).toBeDefined();
  });

  it('should parse PlantUML files (.puml)', async () => {
    const diagram = await parseData('tests/sample-sequence.puml');
    expect(diagram).toBeDefined();
    expect(diagram?.Shapes).toBeDefined();
  });

  it('should parse Excalidraw files (.excalidraw)', async () => {
    const diagram = await parseData('tests/excalidraw.excalidraw');
    expect(diagram).toBeDefined();
    expect(diagram?.Shapes).toBeDefined();
  });

  it('should return undefined for unsupported file types', async () => {
    const diagram = await parseData('tests/unknown.xyz');
    expect(diagram).toBeUndefined();
  });
});
