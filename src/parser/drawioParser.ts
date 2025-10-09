/* eslint-disable @typescript-eslint/no-explicit-any */
import * as fs from 'fs';
import { parseStringPromise } from 'xml2js';
import { Diagram, Shape, Style } from '../types.js';
import { MermaidShape, getMermaidShapeByValue } from '../shapes/flowchartShapes.js';

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
        ShapeType: getMermaidShapeByValue('rectangle'), // default
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

  // Check if the first element is a shape type (common DrawIO pattern)
  if (stylePairs.length > 0) {
    const firstElement = stylePairs[0].trim();
    if (!firstElement.includes('=')) {
      // This is likely a shape type - use getMermaidShapeByValue for consistent mapping
      const mappedShape = mapDrawIOShapeToMermaid(firstElement);
      if (mappedShape !== MermaidShape.Rectangle) {
        shape.ShapeType = mappedShape;
      }
    }
  }

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
          shape.ShapeType = getMermaidShapeByValue('rounded rectangle');
        }
        break;
      case 'dashed':
        if (value === '1') {
          shape.Style.LinePattern = 2; // dashed pattern
        }
        break;
      case 'dashpattern':
        // Parse dash pattern (e.g., "8 8")
        shape.Style.LinePattern = 2; // dashed
        break;
      case 'endarrow':
        shape.Style.EndArrow = mapDrawIOArrowType(value);
        break;
      case 'startarrow':
        shape.Style.BeginArrow = mapDrawIOArrowType(value);
        break;
      case 'endfill':
        shape.Style.EndArrowSize = value === '1' ? 1 : 0;
        break;
      case 'startfill':
        shape.Style.BeginArrowSize = value === '1' ? 1 : 0;
        break;
      // Add more style mappings as needed
    }
  }

  // Special handling for combined styles
  const combinedStyle = stylePairs.join(';').toLowerCase();
  
  // Handle ellipse;shape=cloud pattern
  if (combinedStyle.includes('ellipse') && combinedStyle.includes('shape=cloud')) {
    shape.ShapeType = getMermaidShapeByValue('rectangle'); // Could be cloud in future
  }
  // Handle basic ellipse with aspect=fixed (circle)
  else if (combinedStyle.includes('ellipse') && combinedStyle.includes('aspect=fixed')) {
    shape.ShapeType = getMermaidShapeByValue('circle');
  }
  // Handle plain ellipse
  else if (combinedStyle.includes('ellipse') && !combinedStyle.includes('shape=')) {
    shape.ShapeType = getMermaidShapeByValue('circle');
  }
};

// Map DrawIO shape names to MermaidShape enum using getMermaidShapeByValue
const mapDrawIOShapeToMermaid = (drawioShape: string): MermaidShape => {
  // Map DrawIO-specific shape names to terms that getMermaidShapeByValue understands
  const drawioToStandardMap: Record<string, string> = {
    // Basic shapes
    rectangle: 'rectangle',
    ellipse: 'circle',
    rhombus: 'diamond',
    triangle: 'triangle',
    hexagon: 'hexagon',
    cylinder: 'cylinder',
    cylinder3: 'cylinder',
    process: 'process',
    decision: 'diamond',
    document: 'document',
    parallelogram: 'parallelogram',
    trapezoid: 'trapezoid',
    
    // DrawIO-specific shapes
    step: 'rectangle',
    tape: 'paper-tape',
    card: 'card',
    dataStorage: 'stored-data',
    datastore: 'database',
    internalStorage: 'internalstorage',
    cloud: 'rectangle', // Could be a custom shape in the future
    delay: 'delay',
    display: 'display',
    collate: 'collate',
    manualInput: 'manual-input',
    loopLimit: 'loop-limit',
    offPageConnector: 'rectangle',
    orEllipse: 'circle',
    sumEllipse: 'circle',
    sortShape: 'diamond',
    
    // Flowchart namespace shapes - map to standard terms getMermaidShapeByValue recognizes
    'mxgraph.flowchart.database': 'database',
    'mxgraph.flowchart.decision': 'diamond',
    'mxgraph.flowchart.collate': 'collate',
    'mxgraph.flowchart.delay': 'delay',
    'mxgraph.flowchart.display': 'display',
    'mxgraph.flowchart.document': 'document',
    'mxgraph.flowchart.extract': 'extract',
    'mxgraph.flowchart.extract_or_measurement': 'extract',
    'mxgraph.flowchart.internal_storage': 'internalstorage',
    'mxgraph.flowchart.loop_limit': 'loop-limit',
    'mxgraph.flowchart.manual_input': 'manual-input',
    'mxgraph.flowchart.manual_operation': 'manual',
    'mxgraph.flowchart.merge': 'triangle',
    'mxgraph.flowchart.merge_or_storage': 'triangle',
    'mxgraph.flowchart.multi-document': 'documents',
    'mxgraph.flowchart.off_page_connector': 'rectangle',
    'mxgraph.flowchart.on_page_connector': 'small circle',
    'mxgraph.flowchart.on-page_reference': 'small circle',
    'mxgraph.flowchart.or': 'circle',
    'mxgraph.flowchart.predefined_process': 'subroutine',
    'mxgraph.flowchart.preparation': 'hexagon',
    'mxgraph.flowchart.sequential_data': 'stored-data',
    'mxgraph.flowchart.direct_data': 'stored-data',
    'mxgraph.flowchart.sort': 'diamond',
    'mxgraph.flowchart.start_1': 'terminal',
    'mxgraph.flowchart.start_2': 'circle',
    'mxgraph.flowchart.stored_data': 'stored-data',
    'mxgraph.flowchart.summing_function': 'circle',
    'mxgraph.flowchart.terminator': 'terminal',
  };

  const standardName = drawioToStandardMap[drawioShape.toLowerCase()] || drawioShape;
  return getMermaidShapeByValue(standardName);
};

// Map DrawIO arrow types to our internal arrow types
const mapDrawIOArrowType = (arrowType: string): number => {
  const arrowMap: Record<string, number> = {
    classic: 1, // standard arrow
    block: 2, // filled arrow
    oval: 4, // circle
    diamond: 6, // diamond
    cross: 8, // cross/x
    none: 0, // no arrow
    open: 1, // open arrow
    openAsync: 1, // open arrow
    blockThin: 2, // thin filled arrow
  };

  return arrowMap[arrowType.toLowerCase()] || 1;
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
