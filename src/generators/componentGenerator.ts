import { Diagram, Shape } from '../types.js';
import { shapeToNode, shapeToConnector, NodeRecord, sanitizeLabel } from '../utils/labelUtils.js';

export const generateComponentDiagram = (diagram: Diagram): string => {
  const nodes: NodeRecord[] = [];
  const edges: Shape[] = [];

  for (const shape of diagram.Shapes) {
    if (shape.IsEdge) {
      edges.push(shapeToConnector(shape));
    } else {
      nodes.push(shapeToNode(shape));
    }
  }

  // Generate Mermaid block diagram syntax for components
  let mermaidCode = 'block-beta\n';
  mermaidCode += '  columns 3\n';

  for (const node of nodes) {
    const label = sanitizeLabel(node.Shape.Label);
    mermaidCode += `  ${node.ID}["${label}"]\n`;
  }

  // Add connections
  for (const edge of edges) {
    const label = edge.Label ? ` : ${sanitizeLabel(edge.Label)}` : '';
    mermaidCode += `  ${edge.FromNode} --> ${edge.ToNode}${label}\n`;
  }

  return mermaidCode;
};
