import { describe, it, expect } from 'vitest';
import { parseDiagram } from './plantumlParser.js';

describe('PlantUML Parser', () => {
  it('should parse a simple sequence diagram', async () => {
    const diagram = await parseDiagram('tests/sample-sequence.puml');

    expect(diagram).toBeDefined();
    if (!diagram) return;

    expect(diagram.Shapes).toBeDefined();
    expect(diagram.Shapes.length).toBeGreaterThan(0);

    // Should have actors, participants, and connections
    const actors = diagram.Shapes.filter((s) => !s.IsEdge && s.Label.includes('User'));
    const participants = diagram.Shapes.filter(
      (s) => !s.IsEdge && (s.Label.includes('Frontend') || s.Label.includes('Backend'))
    );
    const edges = diagram.Shapes.filter((s) => s.IsEdge);

    expect(actors.length).toBeGreaterThan(0);
    expect(participants.length).toBeGreaterThan(0);
    expect(edges.length).toBeGreaterThan(0);
  });

  it('should parse a simple activity/flowchart diagram', async () => {
    const diagram = await parseDiagram('tests/sample-flowchart.puml');

    expect(diagram).toBeDefined();
    if (!diagram) return;

    expect(diagram.Shapes).toBeDefined();
    expect(diagram.Shapes.length).toBeGreaterThan(0);

    // Should have start, activities, decisions, and stop
    const startNodes = diagram.Shapes.filter((s) => !s.IsEdge && s.Label.includes('Start'));
    const activities = diagram.Shapes.filter((s) => !s.IsEdge && s.ShapeType === 'rect');
    const decisions = diagram.Shapes.filter((s) => !s.IsEdge && s.ShapeType === 'diam');

    expect(startNodes.length).toBeGreaterThan(0);
    expect(activities.length).toBeGreaterThan(0);
    expect(decisions.length).toBeGreaterThan(0);
  });

  it('should handle PlantUML files that do not exist', async () => {
    const diagram = await parseDiagram('tests/nonexistent.puml');
    expect(diagram).toBeUndefined();
  });

  it('should generate valid node IDs', async () => {
    const diagram = await parseDiagram('tests/sample-sequence.puml');

    expect(diagram).toBeDefined();
    if (!diagram) return;

    // All node IDs should be valid (alphanumeric and underscore only)
    diagram.Shapes.forEach((shape) => {
      expect(shape.Id).toMatch(/^[a-zA-Z0-9_]+$/);
      expect(shape.Id).not.toMatch(/^[0-9]/); // Should not start with number
    });
  });
});
