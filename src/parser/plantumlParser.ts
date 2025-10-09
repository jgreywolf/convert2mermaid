import * as fs from 'fs';
import { Diagram, Shape } from '../types.js';
import { MermaidShape, getMermaidShapeByValue } from '../shapes/flowchartShapes.js';

interface PlantUMLElement {
  type:
    | 'participant'
    | 'actor'
    | 'database'
    | 'control'
    | 'entity'
    | 'boundary'
    | 'collections'
    | 'queue'
    | 'start'
    | 'stop'
    | 'activity'
    | 'decision'
    | 'note';
  id: string;
  label: string;
  alias?: string;
}

interface PlantUMLConnection {
  from: string;
  to: string;
  label?: string;
  arrow: string;
  style: 'solid' | 'dashed' | 'dotted';
}

interface PlantUMLDiagram {
  title?: string;
  theme?: string;
  elements: PlantUMLElement[];
  connections: PlantUMLConnection[];
  diagramType: 'sequence' | 'activity' | 'class' | 'usecase' | 'component' | 'flowchart';
}

const parseArrowType = (arrow: string): { style: 'solid' | 'dashed' | 'dotted'; arrowType: number } => {
  // PlantUML arrow types
  if (arrow.includes('-->')) return { style: 'solid', arrowType: 1 }; // standard arrow
  if (arrow.includes('..>')) return { style: 'dotted', arrowType: 1 }; // dotted arrow
  if (arrow.includes('->')) return { style: 'solid', arrowType: 1 }; // standard arrow
  if (arrow.includes('<->')) return { style: 'solid', arrowType: 1 }; // bidirectional
  if (arrow.includes('<--')) return { style: 'solid', arrowType: 1 }; // reverse arrow

  return { style: 'solid', arrowType: 1 }; // default
};

const generateNodeId = (originalId: string): string => {
  // Convert PlantUML identifiers to Mermaid-compatible node IDs
  return originalId.replace(/[^a-zA-Z0-9]/g, '_').replace(/^[0-9]/, 'n$&'); // Ensure it doesn't start with a number
};

const convertElementToShape = (element: PlantUMLElement, index: number): Shape => {
  let shapeType: MermaidShape = getMermaidShapeByValue('rectangle'); // default

  switch (element.type) {
    case 'actor':
      shapeType = getMermaidShapeByValue('rectangle'); // Actors as rectangles in flowchart
      break;
    case 'participant':
      shapeType = getMermaidShapeByValue('rectangle');
      break;
    case 'database':
      shapeType = getMermaidShapeByValue('database'); // cylinder shape for database
      break;
    case 'control':
      shapeType = getMermaidShapeByValue('circle'); // circle for control
      break;
    case 'entity':
      shapeType = getMermaidShapeByValue('rectangle');
      break;
    case 'boundary':
      shapeType = getMermaidShapeByValue('rectangle');
      break;
    case 'start':
      shapeType = getMermaidShapeByValue('circle'); // circle for start/stop
      break;
    case 'stop':
      shapeType = getMermaidShapeByValue('circle');
      break;
    case 'activity':
      shapeType = getMermaidShapeByValue('rectangle');
      break;
    case 'decision':
      shapeType = getMermaidShapeByValue('diamond'); // diamond for decisions
      break;
    case 'note':
      shapeType = getMermaidShapeByValue('rectangle');
      break;
    default:
      shapeType = getMermaidShapeByValue('rectangle');
  }

  return {
    Id: generateNodeId(element.id),
    ShapeType: shapeType,
    Label: element.label,
    Style: {
      FillForeground: '#ffffff',
      FillBackground: '#ffffff',
      TextColor: '#000000',
      LineWeight: 1,
      LineColor: '#000000',
      LinePattern: 1, // solid line for nodes
      Rounding: 0,
      BeginArrow: 0,
      BeginArrowSize: 1,
      EndArrow: 0,
      EndArrowSize: 1,
      LineCap: 0,
      FillPattern: 1,
    },
    IsEdge: false,
  };
};

const convertConnectionToShape = (connection: PlantUMLConnection, elements: PlantUMLElement[]): Shape => {
  const arrowInfo = parseArrowType(connection.arrow);

  return {
    Id: `${generateNodeId(connection.from)}_to_${generateNodeId(connection.to)}`,
    ShapeType: 'line',
    Label: connection.label || '',
    Style: {
      FillForeground: '#ffffff',
      FillBackground: '#ffffff',
      TextColor: '#000000',
      LineWeight: 1,
      LineColor: '#000000',
      LinePattern: connection.style === 'dashed' ? 2 : connection.style === 'dotted' ? 3 : 1,
      Rounding: 0,
      BeginArrow: 0,
      BeginArrowSize: 1,
      EndArrow: arrowInfo.arrowType,
      EndArrowSize: 1,
      LineCap: 0,
      FillPattern: 1,
    },
    IsEdge: true,
    FromNode: generateNodeId(connection.from),
    ToNode: generateNodeId(connection.to),
  };
};

const parsePlantUMLContent = (content: string): PlantUMLDiagram => {
  const lines = content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const diagram: PlantUMLDiagram = {
    elements: [],
    connections: [],
    diagramType: 'flowchart', // default
  };

  let currentSection = 'main';
  let lastActivityId: string | null = null;
  let decisionStack: string[] = []; // Track decisions for endif matching

  for (const line of lines) {
    // Skip comments and empty lines
    if (line.startsWith("'") || line.startsWith('!') || line === '') continue;

    // Start/End markers
    if (line.startsWith('@startuml')) {
      continue;
    }
    if (line.startsWith('@enduml')) {
      break;
    }

    // Title
    if (line.startsWith('title ')) {
      diagram.title = line.substring(6).trim();
      continue;
    }

    // Detect diagram type
    if (line.includes('actor') || line.includes('participant') || line.includes('database')) {
      diagram.diagramType = 'sequence';
    } else if (line.includes('start') || line.includes('stop') || line.includes('if (') || line.includes('endif')) {
      diagram.diagramType = 'activity';
    }

    // Parse elements
    // Actor definition: actor User
    if (line.startsWith('actor ')) {
      const parts = line.substring(6).trim().split(' as ');
      const id = parts.length > 1 ? parts[1].replace(/"/g, '') : parts[0];
      const label = parts[0].replace(/"/g, '');
      diagram.elements.push({
        type: 'actor',
        id: id,
        label: label,
        alias: parts.length > 1 ? parts[1] : undefined,
      });
      continue;
    }

    // Participant definition: participant "Frontend" as FE
    if (line.startsWith('participant ')) {
      const parts = line.substring(12).trim().split(' as ');
      const label = parts[0].replace(/"/g, '');
      const id = parts.length > 1 ? parts[1].replace(/"/g, '') : label;
      diagram.elements.push({
        type: 'participant',
        id: id,
        label: label,
        alias: parts.length > 1 ? parts[1] : undefined,
      });
      continue;
    }

    // Database definition: database "Database" as DB
    if (line.startsWith('database ')) {
      const parts = line.substring(9).trim().split(' as ');
      const label = parts[0].replace(/"/g, '');
      const id = parts.length > 1 ? parts[1].replace(/"/g, '') : label;
      diagram.elements.push({
        type: 'database',
        id: id,
        label: label,
        alias: parts.length > 1 ? parts[1] : undefined,
      });
      continue;
    }

    // Activity elements
    if (line === 'start') {
      diagram.elements.push({
        type: 'start',
        id: 'start',
        label: 'Start',
      });
      lastActivityId = 'start';
      continue;
    }

    if (line === 'stop') {
      diagram.elements.push({
        type: 'stop',
        id: 'stop',
        label: 'Stop',
      });

      // Connect last activity to stop
      if (lastActivityId) {
        diagram.connections.push({
          from: lastActivityId,
          to: 'stop',
          arrow: '->',
          style: 'solid',
        });
      }
      continue;
    }

    // Activity with label: :User submits form;
    if (line.startsWith(':') && line.endsWith(';')) {
      const label = line.substring(1, line.length - 1);
      const id = `activity_${diagram.elements.filter((e) => e.type === 'activity').length}`;
      diagram.elements.push({
        type: 'activity',
        id: id,
        label: label,
      });

      // Connect from previous activity
      if (lastActivityId) {
        diagram.connections.push({
          from: lastActivityId,
          to: id,
          arrow: '->',
          style: 'solid',
        });
      }
      lastActivityId = id;
      continue;
    }

    // Decision: if (Data valid?) then (yes)
    if (line.startsWith('if (') && line.includes(') then')) {
      const condition = line.match(/if \(([^)]+)\)/)?.[1] || 'condition';
      const id = `decision_${diagram.elements.filter((e) => e.type === 'decision').length}`;
      diagram.elements.push({
        type: 'decision',
        id: id,
        label: condition,
      });

      // Connect from previous activity
      if (lastActivityId) {
        diagram.connections.push({
          from: lastActivityId,
          to: id,
          arrow: '->',
          style: 'solid',
        });
      }

      decisionStack.push(id);
      lastActivityId = id;
      continue;
    }

    // Handle else in decisions
    if (line.startsWith('else (')) {
      // We're in the else branch of a decision
      continue;
    }

    // Handle endif
    if (line === 'endif') {
      if (decisionStack.length > 0) {
        decisionStack.pop();
      }
      continue;
    }

    // Parse connections/arrows
    // Sequence diagram arrows: User -> FE: Submit form
    const arrowPatterns = [
      /^(.+?)\s*(-->|->|<->|<--|\.\.>)\s*(.+?):\s*(.+)$/, // with label
      /^(.+?)\s*(-->|->|<->|<--|\.\.>)\s*(.+?)$/, // without label
    ];

    for (const pattern of arrowPatterns) {
      const match = line.match(pattern);
      if (match) {
        const from = match[1].trim();
        const arrow = match[2];
        const to = match[3].trim();
        const label = match[4]?.trim() || '';

        const arrowInfo = parseArrowType(arrow);

        diagram.connections.push({
          from: from,
          to: to,
          label: label,
          arrow: arrow,
          style: arrowInfo.style,
        });
        break;
      }
    }
  }

  return diagram;
};

export async function parseDiagram(filepath: string): Promise<Diagram | undefined> {
  try {
    const content = fs.readFileSync(filepath, 'utf-8');
    const plantUMLDiagram = parsePlantUMLContent(content);

    const shapes: Shape[] = [];

    // Convert elements to shapes
    plantUMLDiagram.elements.forEach((element, index) => {
      shapes.push(convertElementToShape(element, index));
    });

    // Convert connections to edge shapes
    plantUMLDiagram.connections.forEach((connection) => {
      shapes.push(convertConnectionToShape(connection, plantUMLDiagram.elements));
    });

    return {
      Shapes: shapes,
      Settings: plantUMLDiagram.title,
    };
  } catch (error) {
    console.error(`Error parsing PlantUML file: ${error}`);
    return undefined;
  }
}
