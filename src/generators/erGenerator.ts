import { Diagram, Shape } from '../types.js';
import { sanitizeClassName, sanitizeLabel } from '../utils/labelUtils.js';

export const generateERDiagram = (diagram: Diagram): string => {
  let mermaidSyntax = 'erDiagram\r\n';

  const shapeById = new Map(diagram.Shapes.map((shape) => [shape.Id, shape]));
  const edges = diagram.Shapes.filter((shape) => shape.IsEdge);
  const entityShapes = diagram.Shapes.filter((shape) => !shape.IsEdge && isEntityShape(shape));
  const relationshipShapes = diagram.Shapes.filter((shape) => !shape.IsEdge && isRelationshipShape(shape));

  const entityAttributes = new Map<string, string[]>();
  for (const entity of entityShapes) {
    entityAttributes.set(entity.Id, []);
  }

  for (const edge of edges) {
    const from = edge.FromNode ? shapeById.get(edge.FromNode) : undefined;
    const to = edge.ToNode ? shapeById.get(edge.ToNode) : undefined;

    if (from && to && isAttributeShape(from) && isEntityShape(to)) {
      entityAttributes.get(to.Id)?.push(getAttributeName(from));
    } else if (from && to && isEntityShape(from) && isAttributeShape(to)) {
      entityAttributes.get(from.Id)?.push(getAttributeName(to));
    }
  }

  // Generate entity definitions
  for (const entity of entityShapes) {
    const entityName = getEntityName(entity);
    mermaidSyntax += `  ${entityName} {\r\n`;

    const attributes = entityAttributes.get(entity.Id) || [];
    for (const attribute of attributes) {
      mermaidSyntax += `    string ${attribute}\r\n`;
    }

    mermaidSyntax += `  }\r\n`;
  }

  // Generate Chen-style relationships by collapsing entity -> diamond -> entity paths.
  for (const relationship of relationshipShapes) {
    const connectedEdges = edges.filter(
      (edge) => edge.FromNode === relationship.Id || edge.ToNode === relationship.Id
    );
    const entityConnections = connectedEdges
      .map((edge) => {
        const otherId = edge.FromNode === relationship.Id ? edge.ToNode : edge.FromNode;
        const otherShape = otherId ? shapeById.get(otherId) : undefined;

        if (!otherShape || !isEntityShape(otherShape)) {
          return undefined;
        }

        return {
          entity: otherShape,
          label: edge.Label,
        };
      })
      .filter((connection): connection is EntityConnection => Boolean(connection));

    if (entityConnections.length >= 2) {
      const [left, right] = entityConnections;
      const leftEntity = getEntityName(left.entity);
      const rightEntity = getEntityName(right.entity);
      const cardinality = `${getLeftCardinality(left.label)}--${getRightCardinality(right.label)}`;
      const relationshipLabel = sanitizeLabel(relationship.Label) || 'relationship';
      mermaidSyntax += `  ${leftEntity} ${cardinality} ${rightEntity} : "${relationshipLabel}"\r\n`;
    }
  }

  return mermaidSyntax;
};

interface EntityConnection {
  entity: Shape;
  label: string;
}

const isEntityShape = (shape: Shape): boolean =>
  shape.ShapeType === 'rect' && !shape.Id.toLowerCase().startsWith('attr') && !shape.Id.toLowerCase().startsWith('rel');

const isRelationshipShape = (shape: Shape): boolean => shape.ShapeType === 'diam';

const isAttributeShape = (shape: Shape): boolean => shape.ShapeType === 'circ';

const getEntityName = (shape: Shape): string => sanitizeClassName(sanitizeLabel(shape.Label) || shape.Id);

const getAttributeName = (shape: Shape): string => sanitizeClassName(sanitizeLabel(shape.Label) || shape.Id);

const getLeftCardinality = (label: string): string => {
  const normalized = label.trim().toLowerCase();
  if (normalized === '1' || normalized === 'one') return '||';
  if (normalized === '0' || normalized === 'zero') return 'o|';
  return '}o';
};

const getRightCardinality = (label: string): string => {
  const normalized = label.trim().toLowerCase();
  if (normalized === '1' || normalized === 'one') return '||';
  if (normalized === '0' || normalized === 'zero') return '|o';
  return 'o{';
};
