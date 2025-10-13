import { Diagram } from '../types.js';
import { shapeToNode, NodeRecord, sanitizeLabel } from '../utils/labelUtils.js';

export const generateMindmapDiagram = (diagram: Diagram): string => {
  const nodes: NodeRecord[] = [];

  for (const shape of diagram.Shapes) {
    if (!shape.IsEdge) {
      nodes.push(shapeToNode(shape));
    }
  }

  let mermaidCode = 'mindmap\n';

  // Find root node (assuming first node or one with most connections)
  const rootNode = nodes[0];
  if (rootNode) {
    const rootLabel = sanitizeLabel(rootNode.Shape.Label);
    mermaidCode += `  root(${rootLabel})\n`;

    // Add other nodes as branches
    for (let i = 1; i < nodes.length; i++) {
      const node = nodes[i];
      const label = sanitizeLabel(node.Shape.Label);
      mermaidCode += `    ${label}\n`;
    }
  }

  return mermaidCode;
};
