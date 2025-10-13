import { Shape } from '../types.js';
import { getMermaidShapeByValue } from '../shapes/flowchartShapes.js';

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

export interface NodeRecord {
  ID: string;
  Shape: Shape;
  NodeDef: string;
}

export const shapeToNode = (shape: Shape): NodeRecord => {
  const nodeId = `n0${shape.Id}`;
  const nodeShape = getMermaidShapeByValue(shape.ShapeType);
  const sanitizedLabel = sanitizeLabel(shape.Label);
  const nodeDef = `${nodeId}@{ shape: ${nodeShape}, label: ${sanitizedLabel} }`;
  return { ID: nodeId, Shape: shape, NodeDef: nodeDef };
};

export const shapeToConnector = (connectorShape: Shape): Shape => {
  const edge = connectorShape;
  edge.FromNode = `n0${connectorShape.FromNode}`;
  edge.ToNode = `n0${connectorShape.ToNode}`;

  return edge;
};
