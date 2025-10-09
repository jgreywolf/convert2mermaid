/* eslint-disable @typescript-eslint/no-explicit-any */
import * as fs from 'fs';
import { parseStringPromise } from 'xml2js';
import { Diagram, Shape, Style } from '../types.js';

export interface DrawIOCell {
  id: string;
  value?: string;
  style?: string;
  vertex?: string;
  edge?: string;
  parent?: string;
  source?: string;
  target?: string;
  connectable?: string;
  geometry?: any;
}

// Parse a DrawIO file and return a Diagram
export const parseDiagram = async (filePath: string): Promise<Diagram> => {
  const buffer = fs.readFileSync(filePath);
  const xmlContent = buffer.toString('utf-8');
  const jsonObj = await parseStringPromise(xmlContent);
  const shapes = getShapes(jsonObj);
  return { Shapes: shapes };
};

// Extract shapes from the parsed JSON object
export const getShapes = (jsonObj: any): Shape[] => {
  const shapes: Shape[] = [];

  try {
    const diagram = jsonObj['mxfile']['diagram'];
    if (!diagram || !diagram[0]) {
      return shapes;
    }

    const mxGraphModel = diagram[0]['mxGraphModel'];
    if (!mxGraphModel || !mxGraphModel[0]) {
      return shapes;
    }

    const root = mxGraphModel[0]['root'];
    if (!root || !root[0]) {
      return shapes;
    }

    const cells = root[0]['mxCell'];
    if (!cells) {
      return shapes;
    }

    // First pass: collect all cells and identify vertices and edges
    const cellMap = new Map<string, DrawIOCell>();
    const edgeLabels = new Map<string, string>(); // Map edge ID to label

    for (const cell of cells) {
      const cellData = cell['$'] as DrawIOCell;
      cellMap.set(cellData.id, cellData);

      // Check if this is an edge label
      if (cellData.connectable === '0' && cellData.vertex === '1' && cellData.parent !== '1') {
        const parentId = cellData.parent;
        if (parentId && cellData.value) {
          edgeLabels.set(parentId, cellData.value);
        }
      }
    }

    // Second pass: convert to our Shape format
    for (const [id, cellData] of cellMap.entries()) {
      // Skip root cells (id "0" and "1")
      if (id === '0' || id === '1') {
        continue;
      }

      // Skip edge labels (they have connectable="0" and are attached to edges)
      if (cellData.connectable === '0' && cellData.vertex === '1' && cellData.parent !== '1') {
        continue;
      }

      const shape: Shape = {
        Id: id,
        ShapeType: 'rectangle', // default
        Label: cellData.value || '',
        Style: createDefaultStyle(),
        IsEdge: cellData.edge === '1',
        FromNode: cellData.source || '',
        ToNode: cellData.target || '',
      };

      // Parse style attributes
      if (cellData.style) {
        parseDrawIOStyle(cellData.style, shape);
      }

      // Apply edge label if this is an edge
      if (shape.IsEdge && edgeLabels.has(id)) {
        shape.Label = edgeLabels.get(id) || '';
      }

      // Clean up HTML entities in labels
      if (shape.Label) {
        shape.Label = shape.Label.replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&')
          .replace(/<[^>]*>/g, '') // Remove HTML tags
          .trim();
      }

      shapes.push(shape);
    }
  } catch (e) {
    console.error('Error parsing DrawIO file:', e);
  }

  return shapes;
};

// Parse DrawIO style string and apply to shape
const parseDrawIOStyle = (styleString: string, shape: Shape): void => {
  const stylePairs = styleString.split(';');

  for (const pair of stylePairs) {
    const [key, value] = pair.split('=');
    if (!key || !value) continue;

    switch (key.toLowerCase()) {
      case 'shape':
        shape.ShapeType = mapDrawIOShapeToMermaid(value);
        break;
      case 'fillcolor':
        shape.Style.FillForeground = value;
        break;
      case 'fontcolor':
        shape.Style.TextColor = value;
        break;
      case 'strokecolor':
        shape.Style.LineColor = value;
        break;
      case 'strokewidth':
        shape.Style.LineWeight = parseFloat(value) || 1;
        break;
      case 'rounded':
        if (value === '1') {
          shape.ShapeType = 'rounded rectangle';
        }
        break;
      // Add more style mappings as needed
    }
  }
};

// Map DrawIO shape names to our internal shape types
const mapDrawIOShapeToMermaid = (drawioShape: string): string => {
  const shapeMap: Record<string, string> = {
    rectangle: 'rectangle',
    ellipse: 'circle',
    rhombus: 'diamond',
    triangle: 'triangle',
    hexagon: 'hexagon',
    cylinder: 'cylinder',
    process: 'rectangle',
    decision: 'diamond',
    document: 'document',
    parallelogram: 'parallelogram',
    trapezoid: 'trapezoid',
  };

  return shapeMap[drawioShape.toLowerCase()] || 'rectangle';
};

// Create a default style object
const createDefaultStyle = (): Style => ({
  FillForeground: '',
  FillBackground: '',
  TextColor: '',
  LineWeight: 1,
  LineColor: '',
  LinePattern: 0,
  Rounding: 0,
  BeginArrow: 0,
  BeginArrowSize: 0,
  EndArrow: 0,
  EndArrowSize: 0,
  LineCap: 0,
  FillPattern: 0,
});
