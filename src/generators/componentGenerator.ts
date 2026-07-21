import { Diagram, Shape } from '../types.js';
import { shapeToNode, shapeToConnector, NodeRecord, sanitizeLabel } from '../utils/labelUtils.js';

const escapeBlockLabel = (label: string): string => label.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

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

  const nodeIds = new Set<string>();
  for (const node of nodes) {
    const label = sanitizeLabel(node.Shape.Label);
    if (!label) {
      continue;
    }

    nodeIds.add(node.ID);
    mermaidCode += `  ${node.ID}["${escapeBlockLabel(label)}"]\n`;
  }

  // Add connections
  for (const edge of edges) {
    if (!edge.FromNode || !edge.ToNode || !nodeIds.has(edge.FromNode) || !nodeIds.has(edge.ToNode)) {
      continue;
    }

    const label = edge.Label ? sanitizeLabel(edge.Label) : '';
    const connector = label ? `-- "${escapeBlockLabel(label)}" -->` : '-->';
    mermaidCode += `  ${edge.FromNode} ${connector} ${edge.ToNode}\n`;
  }

  return mermaidCode;
};
