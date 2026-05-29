import { Shape } from '../types.js';
import { MermaidShape, getMermaidShapeByValue } from '../shapes/flowchartShapes.js';

export const sanitizeLabel = (label: string): string => {
  if (!label) return '';

  // Strip colons entirely to avoid Mermaid syntax conflicts
  let sanitized = label.replace(/:/g, '');

  // Replace line breaks with <br/> for Mermaid
  sanitized = sanitized.replace(/\r?\n/g, '<br/>');

  // Replace multiple spaces with single space
  sanitized = sanitized.replace(/\s+/g, ' ');

  // Trim whitespace
  sanitized = sanitized.trim();

  return sanitized;
};

export const sanitizeEdgeLabel = (label: string): string => {
  if (!label) return '';

  const sanitized = sanitizeLabel(label);

  // If edge label has no spaces and is alphanumeric, it might cause parsing issues
  // Quote such labels to avoid syntax conflicts
  if (sanitized && !sanitized.includes(' ') && !sanitized.includes('<br/>')) {
    return `"${sanitized}"`;
  }

  return sanitized;
};

export const sanitizeClassName = (name: string): string => {
  if (!name) return '';
  return name.replace(/[^a-zA-Z0-9_]/g, '').replace(/^[0-9]/, '_$&');
};

export const sanitizeMermaidId = (id: string): string => {
  const sanitized = id.replace(/[^a-zA-Z0-9_]/g, '_');
  return /^[a-zA-Z_]/.test(sanitized) ? sanitized : `id_${sanitized}`;
};

export interface NodeRecord {
  ID: string;
  Shape: Shape;
  NodeDef: string;
}

export const shapeToNode = (shape: Shape): NodeRecord => {
  const nodeId = sanitizeMermaidId(`n0${shape.Id}`);
  const nodeShape = getMermaidShapeByValue(shape.ShapeType);
  const sanitizedLabel = sanitizeLabel(shape.Label);
  const nodeDef = buildLegacyFlowchartNode(nodeId, nodeShape, sanitizedLabel);
  return { ID: nodeId, Shape: shape, NodeDef: nodeDef };
};

const buildLegacyFlowchartNode = (nodeId: string, nodeShape: MermaidShape, label: string): string => {
  const escapedLabel = escapeFlowchartLabel(label);

  switch (nodeShape) {
    case MermaidShape.Rounded:
      return `${nodeId}("${escapedLabel}")`;
    case MermaidShape.Stadium:
      return `${nodeId}(["${escapedLabel}"])`;
    case MermaidShape.Database:
      return `${nodeId}[("${escapedLabel}")]`;
    case MermaidShape.Diamond:
      return `${nodeId}{"${escapedLabel}"}`;
    case MermaidShape.Circle:
    case MermaidShape.DoubleCircle:
    case MermaidShape.SmallCircle:
    case MermaidShape.FramedCircle:
    case MermaidShape.CrossCircle:
    case MermaidShape.FilledCircle:
      return `${nodeId}(("${escapedLabel}"))`;
    case MermaidShape.Hexagon:
      return `${nodeId}{{"${escapedLabel}"}}`;
    case MermaidShape.DataInputOutput:
    case MermaidShape.DataOutputInput:
    case MermaidShape.ManualInput:
      return `${nodeId}[/"${escapedLabel}"/]`;
    case MermaidShape.FramedRect:
    case MermaidShape.MultiRect:
      return `${nodeId}[["${escapedLabel}"]]`;
    default:
      return `${nodeId}["${escapedLabel}"]`;
  }
};

const escapeFlowchartLabel = (label: string): string => label.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

export const shapeToConnector = (connectorShape: Shape): Shape => {
  const edge = connectorShape;
  edge.FromNode = connectorShape.FromNode ? sanitizeMermaidId(`n0${connectorShape.FromNode}`) : '';
  edge.ToNode = connectorShape.ToNode ? sanitizeMermaidId(`n0${connectorShape.ToNode}`) : '';

  return edge;
};
