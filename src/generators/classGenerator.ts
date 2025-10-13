import { Diagram, Shape } from '../types.js';
import {
  extractStereotype,
  extractClassName,
  parseClassContent,
  getShapeLabel,
  isCardinalityLabel,
} from '../utils/classUtils.js';
import { sanitizeClassName, sanitizeLabel } from '../utils/labelUtils.js';
import { determineClassRelationshipType } from '../utils/relationshipUtils.js';

export const generateClassDiagram = (diagram: Diagram): string => {
  let mermaidSyntax = 'classDiagram\r\n';

  const classes: Shape[] = [];
  const relationships: Shape[] = [];

  // Separate classes from relationships and filter out cardinality labels
  for (const shape of diagram.Shapes) {
    if (shape.IsEdge) {
      relationships.push(shape);
    } else if (!isCardinalityLabel(shape)) {
      classes.push(shape);
    }
  }

  // Generate class definitions
  for (const classShape of classes) {
    const className = extractClassName(classShape.Label, sanitizeClassName) || sanitizeClassName(classShape.Id);

    // Skip if the class name is empty, just a number/symbol, or looks like a diagram root ID
    if (!className || /^[_\-\d]+$/.test(className) || className.match(/^[A-Za-z0-9_-]{20,}[0-9]$/)) {
      // Skip long alphanumeric IDs ending in digit (likely root cells)
      continue;
    }

    // Parse class content (attributes and methods)
    const classContent = parseClassContent(classShape.Label);

    // Skip completely empty classes (no label and no content)
    if (!classShape.Label && classContent.length === 0) {
      continue;
    }

    // Extract stereotype if present
    const stereotype = extractStereotype(classShape.Label);

    mermaidSyntax += `  class ${className}`;
    if (stereotype) {
      mermaidSyntax += `\r\n  <<${stereotype}>> ${className}`;
    }
    mermaidSyntax += ` {\r\n`;
    for (const member of classContent) {
      mermaidSyntax += `    ${member}\r\n`;
    }
    mermaidSyntax += `  }\r\n`;
  }

  // Generate relationships
  for (const rel of relationships) {
    let fromClass =
      extractClassName(getShapeLabel(diagram.Shapes, rel.FromNode), sanitizeClassName) ||
      sanitizeClassName(rel.FromNode || '');
    let toClass =
      extractClassName(getShapeLabel(diagram.Shapes, rel.ToNode), sanitizeClassName) ||
      sanitizeClassName(rel.ToNode || '');

    if (fromClass && toClass) {
      const relInfo = determineClassRelationshipType(rel);
      const relType = relInfo.type;
      const shouldReverse = relInfo.reverse;

      // Reverse direction if needed (e.g., for inheritance arrows pointing backwards)
      if (shouldReverse) {
        [fromClass, toClass] = [toClass, fromClass];
      }

      const label = rel.Label ? ` : ${sanitizeLabel(rel.Label)}` : '';
      mermaidSyntax += `  ${fromClass} ${relType} ${toClass}${label}\r\n`;
    }
  }

  return mermaidSyntax;
};
