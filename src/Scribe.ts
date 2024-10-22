import { getMermaidShapeByValue } from './shapes/flowchartShapes.js';
import { Diagram, Shape, Style } from './types.js';

interface NodeRecord {
  ID: string;
  Shape: Shape;
  NodeDef: string;
}

const shapeToNode = (shape: Shape) => {
  const nodeId = `n0${shape.Id}`;
  const nodeShape = getMermaidShapeByValue(shape.Type);
  const nodeDef = `${nodeId}@{ shape: ${nodeShape}, label: ${shape.Label} }`;
  return { ID: nodeId, Shape: shape, NodeDef: nodeDef };
};

const shapeToConnector = (connectorShape: Shape) => {
  const edge = connectorShape;
  edge.FromNode = `n0${connectorShape.FromNode}`;
  edge.ToNode = `n0${connectorShape.ToNode}`;

  return edge;
};

export const generateMermaidCode = (diagram: Diagram) => {
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

      mermaidSyntax += buildEdgeStatement(edgeStart, edgeEnd, edge.Style, edge.Label);

      if (index < edgeCount - 1) {
        mermaidSyntax += '\r\n';
      }

      const style = getStyleStatement(edge.Style);
      if (style) {
        styles.push(`linkStyle ${index} ${style}`);
      }
      index++;
    });
  }

  const styleCount = styles.length;
  index = 0;

  if (styleCount > 0) {
    mermaidSyntax += '\r\n';
    styles.forEach((style) => {
      mermaidSyntax += style;

      if (index < styleCount - 1) {
        mermaidSyntax += '\r\n';
      }

      index++;
    });
  }

  return mermaidSyntax;
};

const getStyleStatement = (style: Style): string => {
  let styleStatement = '';

  // Handle fill properties
  if (style.FillForeground && style.FillBackground && style.FillPattern !== undefined) {
    switch (style.FillPattern) {
      case 0:
        // No fill
        styleStatement += `fill: none,`;
        break;
      case 1:
        // Solid fill, foreground color only
        styleStatement += `fill: ${style.FillForeground},`;
        break;
      case 2:
        // Horizontal stripes example (customize based on pattern type)
        styleStatement += `background: repeating-linear-gradient(0deg, ${style.FillForeground}, ${style.FillForeground} 10px, ${style.FillBackground} 10px, ${style.FillBackground} 20px),`;
        break;
      case 6:
        // Crosshatch fill example
        styleStatement += `background: repeating-linear-gradient(45deg, ${style.FillForeground}, ${style.FillForeground} 10px, ${style.FillBackground} 10px, ${style.FillBackground} 20px),`;
        break;
      // Add more cases here for different fill patterns
      default:
        styleStatement += `fill: ${style.FillForeground},`; // Default solid fill
    }
  }

  if (style.LineWeight && style.LineWeight > 2) {
    styleStatement += `stroke-width: ${Math.round(style.LineWeight)},`; // LineWeight to stroke-width
  }

  if (style.LineColor) {
    styleStatement += `stroke: ${style.LineColor},`;
  }

  if (style.LinePattern) {
    switch (style.LinePattern) {
      case 1:
        // Dashed line
        styleStatement += `stroke-dasharray: 5, 5,`; // Customizable dash length
        break;
      case 2:
        // Dotted line
        styleStatement += `stroke-dasharray: 1, 5,`;
        break;
      case 3:
        // Dash-dot line
        styleStatement += `stroke-dasharray: 5, 5, 1, 5,`;
        break;
      // Add more cases for other line patterns as needed
    }
  }

  if (style.Rounding && style.Rounding > 0) {
    styleStatement += `border-radius: ${style.Rounding}px,`;
  }

  // Handle line caps (start and end of lines)
  if (style.LineCap) {
    switch (style.LineCap) {
      case 0:
        styleStatement += `stroke-linecap: butt,`; // Flat ends
        break;
      case 1:
        styleStatement += `stroke-linecap: round,`; // Rounded ends
        break;
      case 2:
        styleStatement += `stroke-linecap: square,`; // Square ends
        break;
    }
  }

  if (style.FillForeground && styleStatement.indexOf('fill') === -1) {
    styleStatement += `fill: ${style.FillForeground},`;
  }

  return styleStatement.trim().replace(/,$/, '');
};

const buildEdgeStatement = (start: string, end: string, style: Style, text: string): string => {
  let startArrow = getArrow(style.BeginArrow);
  let endArrow = getArrow(style.EndArrow);

  switch (startArrow) {
    case '>':
      startArrow = '<';
      break;
    case '&':
      startArrow = '';
  }

  // we are making an assumption here that if the EndArrow prop was NaN, then default to normal arrow
  if (endArrow === '&') {
    endArrow = '>';
  }

  let { startStroke, endStroke } = getStroke(style.LinePattern);
  if (startArrow === '' && text === '') {
    startStroke = '';
  }

  if (startArrow === '<' && endArrow === '') {
    return `${end} ${endStroke}${text}${startStroke}> ${start}`;
  }

  return `${start} ${startArrow}${startStroke}${text}${endStroke}${endArrow} ${end}`;
};

const getStroke = (linePattern: number) => {
  let startStroke = '--';
  let endStroke = '--';

  if (linePattern) {
    switch (linePattern) {
      case 2:
      case 3:
        // Dotted line
        startStroke = '-.';
        endStroke = '.-';
        break;
      // Add more cases for other line patterns as needed
    }
  }

  return { startStroke, endStroke };
};

function getArrow(arrow: number): string {
  if (isNaN(arrow)) {
    return '&';
  }

  switch (arrow) {
    case 0:
      return '';
    case 6:
    case 7:
      return 'o';
    default:
      return '>';
  }
}
