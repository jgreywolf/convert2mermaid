import { getMermaidShapeByValue } from './shapes/flowchartShapes';
import { Shape, Connector, Page } from './types';

interface NodeRecord {
  ID: string;
  Shape: Shape;
  NodeDef: string;
}

export class Scribe {
  nodes: NodeRecord[] = [];
  edges: Connector[] = [];

  constructor() {}

  private shapeToNode = (shape: Shape) => {
    const nodeId = `n0${shape.ID}`;
    const nodeShape = getMermaidShapeByValue(shape.Name);
    const nodeDef = `${nodeId}@{ shape: ${nodeShape}, label: ${shape.Text} }`;
    this.nodes.push({ ID: nodeId, Shape: shape, NodeDef: nodeDef });
  };

  private shapeToConnector = (shape: Shape, connectors: Connector[]) => {
    const edge = shape as Connector;
    const connector = connectors.find((c) => c.ID === shape.ID);
    if (!connector) {
      return;
    }

    edge.FromNode = `n0${connector.FromNode}`;
    edge.ToNode = `n0${connector.ToNode}`;
    this.edges.push(edge);
  };

  writeMermaidCode = (page: Page) => {
    this.nodes = [];
    this.edges = [];
    for (const shape of page.Shapes) {
      if (shape.Type === 'connector') {
        this.shapeToConnector(shape, page.Connectors);
      } else {
        this.shapeToNode(shape);
      }
    }

    const nodeCount = this.nodes.length;
    let index = 0;

    let mermaidSyntax = 'flowchart TD\r\n';
    this.nodes.forEach((node) => {
      if (node.Shape.Type === 'connector') {
        return;
      }

      mermaidSyntax += node.NodeDef;
      if (index < nodeCount - 1) {
        mermaidSyntax += '\r\n';
      }

      index++;
    });

    const edgeCount = this.edges.length;
    index = 0;

    if (edgeCount > 0) {
      mermaidSyntax += '\r\n';
      this.edges.forEach((connector) => {
        const edgeStart = `${connector.FromNode}`;
        const edgeEnd = `${connector.ToNode}`;

        mermaidSyntax += `${edgeStart} --> ${edgeEnd}`;

        if (index < edgeCount - 1) {
          mermaidSyntax += '\r\n';
        }

        index++;
      });
    }

    console.log(mermaidSyntax);
    return mermaidSyntax;
  };
}
