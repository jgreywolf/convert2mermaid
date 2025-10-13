import { Diagram, Shape } from '../types.js';
import { shapeToNode, shapeToConnector, NodeRecord, sanitizeLabel } from '../utils/labelUtils.js';

export const generateNetworkDiagram = (diagram: Diagram): string => {
  const nodes: NodeRecord[] = [];
  const edges: Shape[] = [];

  for (const shape of diagram.Shapes) {
    if (shape.IsEdge) {
      edges.push(shapeToConnector(shape));
    } else {
      nodes.push(shapeToNode(shape));
    }
  }

  // Use flowchart format but with network-appropriate styling
  let mermaidCode = 'flowchart TD\n';

  for (const node of nodes) {
    const label = sanitizeLabel(node.Shape.Label);
    // Use different shapes for network elements
    const shapeStart = node.Shape.ShapeType?.includes('server') ? '[(' : '[';
    const shapeEnd = node.Shape.ShapeType?.includes('server') ? ')]' : ']';
    mermaidCode += `  ${node.ID}${shapeStart}"${label}"${shapeEnd}\n`;
  }

  // Add network connections
  for (const edge of edges) {
    const label = edge.Label ? `|${sanitizeLabel(edge.Label)}|` : '';
    mermaidCode += `  ${edge.FromNode} ${label} --> ${edge.ToNode}\n`;
  }

  return mermaidCode;
};
