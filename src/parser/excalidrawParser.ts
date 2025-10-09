/* eslint-disable @typescript-eslint/no-explicit-any */
import * as fs from 'fs';
import { Diagram, Shape, Style } from '../types.js';

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
        shape.Style.BeginArrow = mapArrowheadToNumber(element.startArrowhead);
        shape.Style.EndArrow = mapArrowheadToNumber(element.endArrowhead);
      }
    }

    shapes.push(shape);
  }

  return shapes;
};

// Map Excalidraw arrowhead types to numeric values
const mapArrowheadToNumber = (arrowhead: string | null | undefined): number => {
  if (!arrowhead) return 0;

  switch (arrowhead) {
    case 'arrow':
    case 'triangle':
      return 1; // Standard arrow
    case 'triangle_outline':
      return 2; // Outline arrow
    case 'circle':
      return 6; // Circle arrow (using existing enum value)
    case 'circle_outline':
      return 7; // Circle outline arrow
    case 'diamond':
      return 8; // Diamond arrow
    case 'diamond_outline':
      return 9; // Diamond outline arrow
    case 'crowfoot_many':
    case 'crowfoot_one_or_many':
      return 10; // Crow's foot notation
    default:
      return 0; // No arrow
  }
};

// Map Excalidraw shape types to our internal shape types
const mapExcalidrawShapeToMermaid = (excalidrawType: string): string => {
  const shapeMap: Record<string, string> = {
    rectangle: 'rectangle',
    diamond: 'diamond',
    ellipse: 'circle',
    triangle: 'triangle',
    text: 'text',
    arrow: 'arrow',
    line: 'line',
    freedraw: 'line',
    image: 'rectangle',
  };

  return shapeMap[excalidrawType.toLowerCase()] || 'rectangle';
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

  // Map stroke style to line pattern
  if (element.strokeStyle) {
    switch (element.strokeStyle) {
      case 'dashed':
        style.LinePattern = 1;
        break;
      case 'dotted':
        style.LinePattern = 2;
        break;
      default:
        style.LinePattern = 0; // solid
    }
  }

  // Map fill style to fill pattern
  if (element.fillStyle) {
    switch (element.fillStyle) {
      case 'solid':
        style.FillPattern = 1;
        break;
      case 'hachure':
        style.FillPattern = 2;
        break;
      case 'cross-hatch':
        style.FillPattern = 6;
        break;
      default:
        style.FillPattern = 0; // no fill
    }
  }

  return style;
};

// Create a default style object
const createDefaultStyle = (): Style => ({
  FillForeground: '',
  FillBackground: '',
  TextColor: '',
  LineWeight: 1,
  LineColor: '#000000',
  LinePattern: 0,
  Rounding: 0,
  BeginArrow: 0,
  BeginArrowSize: 0,
  EndArrow: 0,
  EndArrowSize: 0,
  LineCap: 0,
  FillPattern: 0,
});
