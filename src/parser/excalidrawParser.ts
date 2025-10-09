/* eslint-disable @typescript-eslint/no-explicit-any */
import * as fs from 'fs';
import { Diagram, Shape, Style } from '../types.js';
import { MermaidShape, getMermaidShapeByValue } from '../shapes/flowchartShapes.js';
import { createDefaultStyle, mapArrowTypeToNumber, mapLinePatternToNumber, mapFillPatternToNumber } from '../utils/styleUtils.js';

export interface ExcalidrawElement {
  type: string;
  id: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  strokeColor?: string;
  backgroundColor?: string;
  fillStyle?: string;
  strokeWidth?: number;
  strokeStyle?: string;
  text?: string;
  fontSize?: number;
  fontFamily?: number;
  isDeleted?: boolean;
  boundElements?: Array<{ type: string; id: string }>;
  startBinding?: { elementId: string; focus: number; gap: number };
  endBinding?: { elementId: string; focus: number; gap: number };
  points?: Array<[number, number]>;
  // Text element properties
  containerId?: string | null;
  // Arrow-specific properties
  startArrowhead?: string | null;
  endArrowhead?: string | null;
}

export interface ExcalidrawFile {
  type: string;
  version: number;
  source: string;
  elements: ExcalidrawElement[];
}

// Parse an Excalidraw file and return a Diagram
export const parseDiagram = async (filePath: string): Promise<Diagram> => {
  try {
    const buffer = fs.readFileSync(filePath);
    const jsonContent = buffer.toString('utf-8');
    const excalidrawData: ExcalidrawFile = JSON.parse(jsonContent);
    const shapes = getShapes(excalidrawData);
    return { Shapes: shapes };
  } catch (error) {
    console.error('Error parsing Excalidraw file:', error);
    return { Shapes: [] };
  }
};

// Extract shapes from the Excalidraw data
export const getShapes = (excalidrawData: ExcalidrawFile): Shape[] => {
  const shapes: Shape[] = [];

  if (!excalidrawData.elements) {
    return shapes;
  }

  // First pass: collect text elements that are bound to containers
  const boundTextMap = new Map<string, string>();
  for (const element of excalidrawData.elements) {
    if (element.type === 'text' && element.containerId && !element.isDeleted) {
      boundTextMap.set(element.containerId, element.text || '');
    }
  }

  // Second pass: process all non-text elements and assign labels
  for (const element of excalidrawData.elements) {
    // Skip deleted elements
    if (element.isDeleted) {
      continue;
    }

    // Skip standalone text elements - they're handled as bound text above
    if (element.type === 'text') {
      continue;
    }

    // Get label from bound text or element's own text
    const label = boundTextMap.get(element.id) || element.text || '';

    const shape: Shape = {
      Id: element.id,
      ShapeType: mapExcalidrawShapeToMermaid(element.type),
      Label: label,
      Style: createStyleFromExcalidrawElement(element),
      IsEdge: isEdgeType(element.type),
      FromNode: '',
      ToNode: '',
    };

    // Handle connectors/arrows
    if (shape.IsEdge) {
      if (element.startBinding?.elementId) {
        shape.FromNode = element.startBinding.elementId;
      }
      if (element.endBinding?.elementId) {
        shape.ToNode = element.endBinding.elementId;
      }

      // Store arrow information for later processing
      if (element.startArrowhead || element.endArrowhead) {
        shape.Style.BeginArrow = mapArrowTypeToNumber(element.startArrowhead);
        shape.Style.EndArrow = mapArrowTypeToNumber(element.endArrowhead);
      }
    }

    shapes.push(shape);
  }

  return shapes;
};

// Map Excalidraw shape types to MermaidShape enum using getMermaidShapeByValue
const mapExcalidrawShapeToMermaid = (excalidrawType: string): MermaidShape => {
  const excalidrawToStandardMap: Record<string, string> = {
    rectangle: 'rectangle',
    diamond: 'diamond',
    ellipse: 'circle',
    triangle: 'triangle',
    text: 'rectangle', // Text blocks as rectangles
    arrow: 'arrow',
    line: 'line',
    freedraw: 'line',
    image: 'rectangle',
  };

  const standardName = excalidrawToStandardMap[excalidrawType.toLowerCase()] || 'rectangle';
  return getMermaidShapeByValue(standardName);
};

// Check if the element type represents an edge/connector
const isEdgeType = (elementType: string): boolean => {
  const edgeTypes = ['arrow', 'line', 'freedraw'];
  return edgeTypes.includes(elementType.toLowerCase());
};

// Create style object from Excalidraw element
const createStyleFromExcalidrawElement = (element: ExcalidrawElement): Style => {
  const style: Style = createDefaultStyle();

  if (element.backgroundColor && element.backgroundColor !== 'transparent') {
    style.FillForeground = element.backgroundColor;
  }

  if (element.strokeColor) {
    style.LineColor = element.strokeColor;
  }

  if (element.strokeWidth) {
    style.LineWeight = element.strokeWidth;
  }

  // Map stroke style to line pattern using utility function
  style.LinePattern = mapLinePatternToNumber(element.strokeStyle);

  // Map fill style to fill pattern using utility function  
  style.FillPattern = mapFillPatternToNumber(element.fillStyle);

  return style;
};
