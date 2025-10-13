import { Diagram, Shape } from '../types.js';
import { sanitizeClassName, sanitizeLabel } from '../utils/labelUtils.js';
import { parseCardinality, parseEntityAttributes } from '../utils/relationshipUtils.js';

export const generateERDiagram = (diagram: Diagram): string => {
  let mermaidSyntax = 'erDiagram\r\n';

  const entities: Shape[] = [];
  const relationships: Shape[] = [];

  // Separate entities from relationships
  for (const shape of diagram.Shapes) {
    if (shape.IsEdge) {
      relationships.push(shape);
    } else {
      entities.push(shape);
    }
  }

  // Generate entity definitions
  for (const entity of entities) {
    const entityName = sanitizeClassName(entity.Id);
    mermaidSyntax += `  ${entityName} {\r\n`;

    // Parse entity attributes
    const attributes = parseEntityAttributes(entity.Label);
    for (const attr of attributes) {
      mermaidSyntax += `    ${attr}\r\n`;
    }

    mermaidSyntax += `  }\r\n`;
  }

  // Generate relationships
  for (const rel of relationships) {
    const fromEntity = sanitizeClassName(rel.FromNode || '');
    const toEntity = sanitizeClassName(rel.ToNode || '');

    if (fromEntity && toEntity) {
      const cardinality = parseCardinality(rel.Label);
      mermaidSyntax += `  ${fromEntity} ${cardinality} ${toEntity} : "${
        sanitizeLabel(rel.Label) || 'relationship'
      }"\r\n`;
    }
  }

  return mermaidSyntax;
};
