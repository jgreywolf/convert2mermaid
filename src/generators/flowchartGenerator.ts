import { Diagram, Shape } from '../types.js';
import { shapeToNode, shapeToConnector, NodeRecord, sanitizeEdgeLabel } from '../utils/labelUtils.js';
import { getStyleStatement, buildEdgeStatement } from '../utils/styleUtils.js';

export const generateFlowchartDiagram = (diagram: Diagram): string => {
  const nodes: NodeRecord[] = [];
  const edges: Shape[] = [];
  const styles: string[] = [];

  for (const shape of diagram.Shapes) {
    if (shape.IsEdge) {
      edges.push(shapeToConnector(shape));
    } else {
      nodes.push(shapeToNode(shape));
    }
  }

  const nodeCount = nodes.length;
  let index = 0;

  let mermaidSyntax = 'flowchart TD\r\n';
  nodes.forEach((node) => {
    if (node.Shape.IsEdge) {
      return;
    }

    mermaidSyntax += node.NodeDef;
    if (index < nodeCount - 1) {
      mermaidSyntax += '\r\n';
    }

    const nodeStyle = getStyleStatement(node.Shape.Style);
    if (nodeStyle) {
      styles.push(`style ${node.ID} ${nodeStyle}`);
    }
    index++;
  });

  const edgeCount = edges.length;
  index = 0;

  if (edgeCount > 0) {
    mermaidSyntax += '\r\n';
    edges.forEach((edge) => {
      const edgeStart = `${edge.FromNode}`;
      const edgeEnd = `${edge.ToNode}`;

      const edgeStatement = buildEdgeStatement(edgeStart, edgeEnd, edge.Style, edge.Label, sanitizeEdgeLabel);
      mermaidSyntax += edgeStatement;

      if (index < edgeCount - 1) {
        mermaidSyntax += '\r\n';
      }

      const linkStyle = getStyleStatement(edge.Style);
      if (linkStyle) {
        styles.push(`linkStyle ${index} ${linkStyle}`);
      }
      index++;
    });
  }

  if (styles.length > 0) {
    mermaidSyntax += '\r\n';
    styles.forEach((style) => {
      mermaidSyntax += style + '\r\n';
    });
  }

  return mermaidSyntax;
};
