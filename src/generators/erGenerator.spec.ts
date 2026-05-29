import { describe, expect, it } from 'vitest';
import { parseData } from '../parser/parser.js';
import { generateMermaidCode } from '../scribe.js';

describe('ER diagram generation', () => {
  it('uses DrawIO value labels for entities, attributes, and relationships', async () => {
    const diagram = await parseData('tests/EntityRelationshipDiagram.drawio');

    expect(diagram).toBeDefined();
    if (!diagram) {
      throw new Error('Failed to parse ER diagram fixture');
    }

    const mermaidCode = generateMermaidCode(diagram);

    expect(mermaidCode).toContain('Customer {');
    expect(mermaidCode).toContain('string CustomerID');
    expect(mermaidCode).toContain('string Name');
    expect(mermaidCode).toContain('string Email');
    expect(mermaidCode).toContain('Order {');
    expect(mermaidCode).toContain('string OrderID');
    expect(mermaidCode).toContain('string OrderDate');
    expect(mermaidCode).toContain('Product {');
    expect(mermaidCode).toContain('Category {');
    expect(mermaidCode).toContain('Customer ||--o{ Order : "Places"');
    expect(mermaidCode).toContain('Order ||--o{ Product : "Contains"');
    expect(mermaidCode).toContain('Product }o--|| Category : "Belongs To"');
    expect(mermaidCode).not.toContain('entity1 {');
    expect(mermaidCode).not.toContain('attr1 {');
    expect(mermaidCode).not.toContain('rel1 {');
  });
});
