import { getMermaidShapeByValue } from './shapes/flowchartShapes.js';
import { Diagram, Shape, Style } from './types.js';
import { DiagramType } from './detection/types.js';

interface NodeRecord {
  ID: string;
  Shape: Shape;
  NodeDef: string;
}

const sanitizeLabel = (label: string): string => {
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

const sanitizeEdgeLabel = (label: string): string => {
  if (!label) return '';

  const sanitized = sanitizeLabel(label);

  // If edge label has no spaces and is alphanumeric, it might cause parsing issues
  // Quote such labels to avoid syntax conflicts
  if (sanitized && !sanitized.includes(' ') && !sanitized.includes('<br/>')) {
    return `"${sanitized}"`;
  }

  return sanitized;
};

const shapeToNode = (shape: Shape) => {
  const nodeId = `n0${shape.Id}`;
  const nodeShape = getMermaidShapeByValue(shape.ShapeType);
  const sanitizedLabel = sanitizeLabel(shape.Label);
  const nodeDef = `${nodeId}@{ shape: ${nodeShape}, label: ${sanitizedLabel} }`;
  return { ID: nodeId, Shape: shape, NodeDef: nodeDef };
};

const shapeToConnector = (connectorShape: Shape) => {
  const edge = connectorShape;
  edge.FromNode = `n0${connectorShape.FromNode}`;
  edge.ToNode = `n0${connectorShape.ToNode}`;

  return edge;
};

export const generateMermaidCode = (diagram: Diagram) => {
  // Determine diagram type from analysis, fallback to flowchart
  const diagramType = diagram.Analysis?.detectedType || DiagramType.FLOWCHART;

  // Use different generation strategies based on detected type
  switch (diagramType) {
    case DiagramType.CLASS:
      return generateClassDiagram(diagram);
    case DiagramType.SEQUENCE:
      return generateSequenceDiagram(diagram);
    case DiagramType.STATE:
      return generateStateDiagram(diagram);
    case DiagramType.ENTITY_RELATIONSHIP:
      return generateERDiagram(diagram);
    case DiagramType.COMPONENT:
      return generateComponentDiagram(diagram);
    case DiagramType.NETWORK:
      return generateNetworkDiagram(diagram);
    case DiagramType.GANTT:
      return generateGanttDiagram(diagram);
    case DiagramType.MINDMAP:
      return generateMindmapDiagram(diagram);
    case DiagramType.TIMELINE:
      return generateTimelineDiagram(diagram);
    case DiagramType.FLOWCHART:
    default:
      return generateFlowchartDiagram(diagram);
  }
};

const generateFlowchartDiagram = (diagram: Diagram) => {
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

      const edgeStatement = buildEdgeStatement(edgeStart, edgeEnd, edge.Style, edge.Label);
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

const generateClassDiagram = (diagram: Diagram) => {
  let mermaidSyntax = 'classDiagram\r\n';

  const classes: Shape[] = [];
  const relationships: Shape[] = [];

  // Helper function to check if a shape is just a cardinality label
  const isCardinalityLabel = (shape: Shape): boolean => {
    const label = shape.Label?.trim() || '';
    // Check if it's a simple cardinality notation
    return (
      /^(\d+|\*|0\.\.1|1\.\.\*|0\.\.\*|\d+\.\.\d+|[mn])$/.test(label) ||
      (label === '' && shape.Id.match(/^[_\-]?\d+$/) !== null)
    );
  };

  // Separate classes from relationships and filter out cardinality labels
  for (const shape of diagram.Shapes) {
    if (shape.IsEdge) {
      relationships.push(shape);
    } else if (!isCardinalityLabel(shape)) {
      classes.push(shape);
    }
  }

  // Generate class definitions
  for (const classShape of classes) {
    const className = extractClassName(classShape.Label) || sanitizeClassName(classShape.Id);

    // Skip if the class name is empty, just a number/symbol, or looks like a diagram root ID
    if (!className || /^[_\-\d]+$/.test(className) || className.match(/^[A-Za-z0-9_-]{20,}[0-9]$/)) {
      // Skip long alphanumeric IDs ending in digit (likely root cells)
      continue;
    }

    // Parse class content (attributes and methods)
    const classContent = parseClassContent(classShape.Label);

    // Skip completely empty classes (no label and no content)
    if (!classShape.Label && classContent.length === 0) {
      continue;
    }

    // Extract stereotype if present
    const stereotype = extractStereotype(classShape.Label);

    mermaidSyntax += `  class ${className}`;
    if (stereotype) {
      mermaidSyntax += `\r\n  <<${stereotype}>> ${className}`;
    }
    mermaidSyntax += ` {\r\n`;
    for (const member of classContent) {
      mermaidSyntax += `    ${member}\r\n`;
    }
    mermaidSyntax += `  }\r\n`;
  }

  // Generate relationships
  for (const rel of relationships) {
    let fromClass =
      extractClassName(getShapeLabel(diagram.Shapes, rel.FromNode)) || sanitizeClassName(rel.FromNode || '');
    let toClass = extractClassName(getShapeLabel(diagram.Shapes, rel.ToNode)) || sanitizeClassName(rel.ToNode || '');

    if (fromClass && toClass) {
      const relInfo = determineClassRelationshipType(rel);
      const relType = relInfo.type;
      const shouldReverse = relInfo.reverse;

      // Reverse direction if needed (e.g., for inheritance arrows pointing backwards)
      if (shouldReverse) {
        [fromClass, toClass] = [toClass, fromClass];
      }

      const label = rel.Label ? ` : ${sanitizeLabel(rel.Label)}` : '';
      mermaidSyntax += `  ${fromClass} ${relType} ${toClass}${label}\r\n`;
    }
  }

  return mermaidSyntax;
};

const generateSequenceDiagram = (diagram: Diagram) => {
  let mermaidSyntax = 'sequenceDiagram\r\n';

  const participants: Shape[] = [];
  const actors: Shape[] = [];
  const messages: Shape[] = [];
  const notes: Shape[] = [];
  const frames: Shape[] = [];
  let hasSequenceNumbers = false;

  // Separate shapes by type
  for (const shape of diagram.Shapes) {
    if (shape.IsEdge) {
      messages.push(shape);
    } else if (shape.ParticipantType === 'actor') {
      actors.push(shape);
    } else if (shape.ParticipantType === 'participant') {
      participants.push(shape);
    } else if (shape.ParticipantType === 'note') {
      notes.push(shape);
    } else if (shape.ParticipantType === 'frame') {
      frames.push(shape);
    } else if (shape.ParticipantType === 'activation') {
      // Skip activation boxes - they're visual elements, not participants
      continue;
    } else if (shape.Label && /^\d+$/.test(shape.Label.trim())) {
      // Skip numeric labels (sequence numbers) but note their presence
      hasSequenceNumbers = true;
      continue;
    } else if (shape.Label && /^\[.*\]$/.test(shape.Label.trim())) {
      // Skip frame section labels like [Broadcast to subscribers]
      continue;
    } else if (!shape.Label || shape.Label.trim().length === 0) {
      // Skip shapes with no label
      continue;
    } else {
      // Default to participant for untyped shapes
      participants.push(shape);
    }
  }

  // Helper to generate short alias from participant name
  const generateAlias = (label: string, existingAliases: Set<string>): string => {
    if (!label || label.trim().length === 0) {
      return 'P' + Math.random().toString(36).substr(2, 4);
    }

    // Try to create meaningful short alias
    // Split on common delimiters and take first letters or meaningful words
    const words = label.split(/[\s/()]+/).filter((w) => w.length > 0);

    if (words.length === 1) {
      // Single word - try first letter, then first 2-3 letters
      let alias = words[0].charAt(0).toUpperCase();
      if (existingAliases.has(alias)) {
        alias = words[0].substring(0, Math.min(3, words[0].length));
      }

      // If still conflicts, add number
      let counter = 1;
      let finalAlias = alias;
      while (existingAliases.has(finalAlias)) {
        finalAlias = alias + counter++;
      }
      return finalAlias;
    } else {
      // Multiple words - use initials
      let alias = words.map((w) => w.charAt(0).toUpperCase()).join('');

      // If too long, take first 4 characters
      if (alias.length > 4) {
        alias = alias.substring(0, 4);
      }

      // Handle conflicts
      let counter = 1;
      let finalAlias = alias;
      while (existingAliases.has(finalAlias)) {
        finalAlias = alias.substring(0, 3) + counter++;
      }
      return finalAlias;
    }
  };

  const aliasMap = new Map<string, string>();
  const usedAliases = new Set<string>();

  // Add autonumber if sequence numbers were detected
  if (hasSequenceNumbers) {
    mermaidSyntax += '  autonumber\r\n\r\n';
  }

  // Generate actor declarations first
  for (const actor of actors) {
    const actorName = sanitizeLabel(actor.Label) || actor.Id;
    const alias = generateAlias(actorName, usedAliases);
    usedAliases.add(alias);
    aliasMap.set(actor.Id, alias);
    mermaidSyntax += `  actor ${alias} as ${actorName}\r\n`;
  }

  // Generate participant declarations
  for (const participant of participants) {
    const participantName = sanitizeLabel(participant.Label) || participant.Id;
    const alias = generateAlias(participantName, usedAliases);
    usedAliases.add(alias);
    aliasMap.set(participant.Id, alias);
    mermaidSyntax += `  participant ${alias} as ${participantName}\r\n`;
  }

  // Generate message flows
  for (const message of messages) {
    let from = message.FromNode || '';
    let to = message.ToNode || '';
    const messageText = sanitizeLabel(message.Label) || '';

    // Map IDs to aliases
    from = aliasMap.get(from) || from;
    to = aliasMap.get(to) || to;

    if (from && to) {
      // Determine arrow type based on style
      const arrow = message.Style.LinePattern === 2 ? '-->' : '->';
      mermaidSyntax += `  ${from}${arrow}${to}: ${messageText}\r\n`;
    }
  }

  return mermaidSyntax;
};

const generateStateDiagram = (diagram: Diagram) => {
  let mermaidSyntax = 'stateDiagram-v2\r\n';

  const states: Shape[] = [];
  const transitions: Shape[] = [];

  // Separate states from transitions
  for (const shape of diagram.Shapes) {
    if (shape.IsEdge) {
      transitions.push(shape);
    } else {
      states.push(shape);
    }
  }

  // Generate state definitions
  for (const state of states) {
    const stateName = sanitizeLabel(state.Label) || state.Id;
    if (stateName.toLowerCase().includes('start') || stateName.toLowerCase().includes('initial')) {
      mermaidSyntax += `  [*] --> ${state.Id}\r\n`;
    } else if (stateName.toLowerCase().includes('end') || stateName.toLowerCase().includes('final')) {
      mermaidSyntax += `  ${state.Id} --> [*]\r\n`;
    } else {
      mermaidSyntax += `  state "${stateName}" as ${state.Id}\r\n`;
    }
  }

  // Generate transitions
  for (const transition of transitions) {
    const from = transition.FromNode || '';
    const to = transition.ToNode || '';
    const trigger = transition.Label ? ` : ${sanitizeLabel(transition.Label)}` : '';

    if (from && to) {
      mermaidSyntax += `  ${from} --> ${to}${trigger}\r\n`;
    }
  }

  return mermaidSyntax;
};

const generateERDiagram = (diagram: Diagram) => {
  let mermaidSyntax = 'erDiagram\r\n';

  const entities: Shape[] = [];
  const relationships: Shape[] = [];

  // Separate entities from relationships
  for (const shape of diagram.Shapes) {
    if (shape.IsEdge) {
      relationships.push(shape);
    } else {
      entities.push(shape);
    }
  }

  // Generate entity definitions
  for (const entity of entities) {
    const entityName = sanitizeClassName(entity.Id);
    mermaidSyntax += `  ${entityName} {\r\n`;

    // Parse entity attributes
    const attributes = parseEntityAttributes(entity.Label);
    for (const attr of attributes) {
      mermaidSyntax += `    ${attr}\r\n`;
    }

    mermaidSyntax += `  }\r\n`;
  }

  // Generate relationships
  for (const rel of relationships) {
    const fromEntity = sanitizeClassName(rel.FromNode || '');
    const toEntity = sanitizeClassName(rel.ToNode || '');

    if (fromEntity && toEntity) {
      const cardinality = parseCardinality(rel.Label);
      mermaidSyntax += `  ${fromEntity} ${cardinality} ${toEntity} : "${
        sanitizeLabel(rel.Label) || 'relationship'
      }"\r\n`;
    }
  }

  return mermaidSyntax;
};

// Helper functions for diagram generation

const sanitizeClassName = (name: string): string => {
  if (!name) return '';
  return name.replace(/[^a-zA-Z0-9_]/g, '').replace(/^[0-9]/, '_$&');
};

const extractStereotype = (label: string): string => {
  if (!label) return '';

  // Decode HTML entities FIRST, before removing tags
  let content = label.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

  // Look for <<stereotype>> notation BEFORE removing HTML tags
  const stereotypeMatch = content.match(/<<([^>]+)>>/);
  if (stereotypeMatch) {
    return stereotypeMatch[1].trim();
  }

  return '';
};

const extractClassName = (label: string): string => {
  if (!label) return '';

  // Look for class name in <b> tags first
  const boldMatch = label.match(/<b>([^<]+)<\/b>/);
  if (boldMatch) {
    return sanitizeClassName(boldMatch[1]);
  }

  // Decode HTML entities
  let content = label.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  content = content.replace(/<[^>]*>/g, ''); // Remove all HTML tags

  // Check for plain text format with --- separator
  if (content.includes('---')) {
    const parts = content.split('---');
    if (parts.length > 0) {
      const className = parts[0].trim();
      if (className) {
        return sanitizeClassName(className);
      }
    }
  }

  // Check for <<stereotype>> notation
  if (content.includes('<<') && content.includes('>>')) {
    // Extract content after stereotype
    const afterStereotype = content.split('>>')[1];
    if (afterStereotype) {
      const words = afterStereotype.trim().split(/[\r\n]+/);
      if (words.length > 0) {
        return sanitizeClassName(words[0].trim());
      }
    }
  }

  // Get the first line/word as class name
  const lines = content.split(/[\r\n]+/).filter((line) => line.trim().length > 0);
  if (lines.length > 0) {
    const firstLine = lines[0].trim();
    // Skip if it starts with visibility modifier (it's an attribute/method)
    if (!firstLine.match(/^[+\-#~]\s/)) {
      return sanitizeClassName(firstLine);
    }
  }

  // Fallback: get first meaningful word
  const words = content.split(/\s+/).filter((word) => word.length > 0);
  if (words.length > 0) {
    return sanitizeClassName(words[0]);
  }

  return '';
};

const parseClassContent = (label: string): string[] => {
  if (!label) return [];

  // First decode HTML entities properly
  let content = label
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ');

  const members: string[] = [];
  let lines: string[] = [];

  // Check if content has HTML formatting or plain text formatting
  if (content.includes('<hr')) {
    // HTML format: Split by <hr> tags to separate sections
    const sections = content.split(/<hr[^>]*>/);

    // Process each section after the first (skip title section)
    for (let i = 1; i < sections.length; i++) {
      const section = sections[i];
      // Remove paragraph tags but keep content
      let cleanSection = section.replace(/<\/p>/g, '').replace(/<p[^>]*>/g, '');
      // Split by <br> tags to get individual lines
      const sectionLines = cleanSection
        .split(/<br[^>]*>/g)
        .map((line) => line.replace(/<[^>]*>/g, '').trim())
        .filter((line) => line.length > 0);
      lines.push(...sectionLines);
    }
  } else if (content.includes('---')) {
    // Plain text format with --- separator
    const parts = content.split('---');
    if (parts.length > 1) {
      // Skip the first part (class name) and process the rest
      for (let i = 1; i < parts.length; i++) {
        const sectionLines = parts[i]
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter((line) => line.length > 0);
        lines.push(...sectionLines);
      }
    }
  } else {
    // Fallback: split by newlines
    lines = content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .slice(1); // Skip first line (class name)
  }

  // Process each line
  for (const line of lines) {
    const cleanLine = line.trim();

    if (!cleanLine) continue;

    // Skip horizontal lines and empty content
    if (cleanLine === '---' || cleanLine.match(/^-+$/)) continue;

    if (cleanLine.includes('(') && cleanLine.includes(')')) {
      // Method - parse and clean up
      const visibility = cleanLine.startsWith('+')
        ? '+'
        : cleanLine.startsWith('-')
        ? '-'
        : cleanLine.startsWith('#')
        ? '#'
        : cleanLine.startsWith('~')
        ? '~'
        : '+';

      let method = cleanLine.replace(/^[+\-#~]\s*/, '').trim();

      // Clean up double colons (::) that might appear in the format
      method = method.replace(/\s*:\s*:\s*/g, ': ');

      if (method) {
        members.push(`${visibility}${method}`);
      }
    } else if (
      cleanLine.startsWith('+') ||
      cleanLine.startsWith('-') ||
      cleanLine.startsWith('#') ||
      cleanLine.startsWith('~')
    ) {
      // Attribute with visibility modifier
      const visibility = cleanLine.startsWith('+')
        ? '+'
        : cleanLine.startsWith('-')
        ? '-'
        : cleanLine.startsWith('#')
        ? '#'
        : cleanLine.startsWith('~')
        ? '~'
        : '-';

      const attribute = cleanLine.replace(/^[+\-#~]\s*/, '').trim();
      if (attribute) {
        members.push(`${visibility}${attribute}`);
      }
    }
  }

  return members;
};

const getShapeLabel = (shapes: Shape[], shapeId: string | undefined): string => {
  if (!shapeId) return '';

  const shape = shapes.find((s) => s.Id === shapeId);
  return shape?.Label || '';
};

const parseEntityAttributes = (label: string): string[] => {
  if (!label) return [];

  const lines = label
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const attributes: string[] = [];

  for (const line of lines) {
    if (line.includes(':') || line.includes(' ')) {
      const parts = line.split(/[:\s]+/);
      if (parts.length >= 2) {
        const attrName = parts[0];
        const attrType = parts[1] || 'string';
        attributes.push(`${attrType} ${attrName}`);
      }
    }
  }

  return attributes.length > 0 ? attributes : ['string name'];
};

const determineClassRelationshipType = (rel: Shape): { type: string; reverse: boolean } => {
  // First check arrow styles for UML relationships
  const startArrow = rel.Style.BeginArrow;
  const endArrow = rel.Style.EndArrow;
  const startFill = rel.Style.BeginArrowSize; // In DrawIO, this indicates filled (1) or hollow (0)
  const endFill = rel.Style.EndArrowSize;
  const linePattern = rel.Style.LinePattern;

  // Check for interface implementation FIRST (hollow triangle with dashed line)
  // DrawIO: openthin arrow (4) or dashed line with block arrow
  // This must come before inheritance check since both use block arrows
  if (linePattern === 2) {
    if (endArrow === 4 || (endArrow === 2 && endFill === 0)) {
      return { type: '..|>', reverse: false }; // Implementation
    }
    if (startArrow === 4 || (startArrow === 2 && startFill === 0)) {
      return { type: '..|>', reverse: true }; // Implementation (reversed)
    }
  }

  // Check for inheritance (filled/hollow triangle arrow on solid line)
  // DrawIO: blockthin arrow (3) or block arrow (2) with hollow fill
  // If arrow is at start (BeginArrow), we need to reverse direction
  if (endArrow === 3 || (endArrow === 2 && endFill === 0 && linePattern !== 2)) {
    return { type: '--|>', reverse: false }; // Inheritance
  }
  if (startArrow === 3 || (startArrow === 2 && startFill === 0 && linePattern !== 2)) {
    return { type: '--|>', reverse: true }; // Inheritance (reversed)
  }

  // Check for composition (filled diamond)
  // DrawIO: diamond arrow (8) with fill (startFill=1)
  if (startArrow === 8 && startFill === 1) {
    return { type: '*--', reverse: false }; // Composition
  }
  if (endArrow === 8 && endFill === 1) {
    return { type: '--*', reverse: false }; // Composition (diamond at end)
  }

  // Check for aggregation (hollow diamond)
  // DrawIO: diamond arrow (8) without fill (startFill=0 or undefined)
  if (startArrow === 8 && startFill === 0) {
    return { type: 'o--', reverse: false }; // Aggregation
  }
  if (endArrow === 8 && endFill === 0) {
    return { type: '--o', reverse: false }; // Aggregation (diamond at end)
  }

  // Check for dependency (dashed line with arrow)
  if (linePattern === 2) {
    return { type: '..>', reverse: false }; // Dependency
  }

  // Fallback: check label for relationship type keywords
  const label = rel.Label?.toLowerCase() || '';

  if (label.includes('inherit') || label.includes('extends')) {
    return { type: '--|>', reverse: false };
  } else if (label.includes('implement') || label.includes('interface')) {
    return { type: '..|>', reverse: false };
  } else if (label.includes('composition')) {
    return { type: '*--', reverse: false };
  } else if (label.includes('aggregation')) {
    return { type: 'o--', reverse: false };
  } else if (label.includes('dependency') || label.includes('depends')) {
    return { type: '..>', reverse: false };
  }

  // Default association
  return { type: '-->', reverse: false }; // Association
};

const parseCardinality = (label: string): string => {
  if (!label) return '||--||';

  const cardinality = label.toLowerCase();
  if (cardinality.includes('1:1') || cardinality.includes('one to one')) {
    return '||--||';
  } else if (cardinality.includes('1:m') || cardinality.includes('1:n') || cardinality.includes('one to many')) {
    return '||--o{';
  } else if (cardinality.includes('m:n') || cardinality.includes('many to many')) {
    return '}o--o{';
  } else {
    return '||--||';
  }
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

  // Sanitize the edge label text with special handling for edge labels
  const sanitizedText = sanitizeEdgeLabel(text);

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
  if (startArrow === '' && sanitizedText === '') {
    startStroke = '';
  }

  if (startArrow === '<' && endArrow === '') {
    return `${end} ${endStroke}${sanitizedText}${startStroke}> ${start}`;
  }

  return `${start} ${startArrow}${startStroke}${sanitizedText}${endStroke}${endArrow} ${end}`;
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
      return ''; // No arrow
    case 1:
      return '>'; // Basic arrow
    case 2:
      return 'x'; // Cross arrow (supported in flowcharts)
    case 3:
      return 'o'; // Circle (hollow) (supported in flowcharts)
    case 4:
      return 'o'; // Circle (filled) - map to hollow circle for flowchart compatibility
    case 5:
      return '>'; // Square - map to standard arrow for flowchart compatibility
    case 6:
      return 'o'; // Diamond (hollow) - map to circle for flowchart compatibility
    case 7:
      return 'o'; // Diamond (filled) - map to circle for flowchart compatibility
    case 8:
      return '>'; // Triangle outline - map to standard arrow for flowchart compatibility
    case 9:
      return '>'; // Triangle filled (standard arrow)
    case 10:
      return '>'; // Bar/line end - map to standard arrow for flowchart compatibility
    case 11:
      return 'o'; // Crowfoot many - map to circle for flowchart compatibility
    case 12:
      return 'o'; // Crowfoot one or many - map to circle for flowchart compatibility
    default:
      return '>'; // Default to standard arrow
  }
}

// TODO: For future diagram types (ERD, Class diagrams, etc.), consider supporting additional arrow types:
// case 4: return '*'; // Circle (filled) - for ERD/Class diagrams
// case 5: return ']'; // Square - for ERD/Class diagrams
// case 8: return '<'; // Triangle outline - for ERD/Class diagrams
// case 10: return '|'; // Bar/line end - for ERD/Class diagrams
// case 11: return '}'; // Crowfoot many - for ERD diagrams
// case 12: return '{'; // Crowfoot one or many - for ERD diagrams

/**
 * Generate Component Diagram in Mermaid format
 */
const generateComponentDiagram = (diagram: Diagram) => {
  const nodes: NodeRecord[] = [];
  const edges: Shape[] = [];

  for (const shape of diagram.Shapes) {
    if (shape.IsEdge) {
      edges.push(shapeToConnector(shape));
    } else {
      nodes.push(shapeToNode(shape));
    }
  }

  // Generate Mermaid block diagram syntax for components
  let mermaidCode = 'block-beta\n';
  mermaidCode += '  columns 3\n';

  for (const node of nodes) {
    const label = sanitizeLabel(node.Shape.Label);
    mermaidCode += `  ${node.ID}["${label}"]\n`;
  }

  // Add connections
  for (const edge of edges) {
    const label = edge.Label ? ` : ${sanitizeLabel(edge.Label)}` : '';
    mermaidCode += `  ${edge.FromNode} --> ${edge.ToNode}${label}\n`;
  }

  return mermaidCode;
};

/**
 * Generate Network Diagram in Mermaid format
 */
const generateNetworkDiagram = (diagram: Diagram) => {
  const nodes: NodeRecord[] = [];
  const edges: Shape[] = [];

  for (const shape of diagram.Shapes) {
    if (shape.IsEdge) {
      edges.push(shapeToConnector(shape));
    } else {
      nodes.push(shapeToNode(shape));
    }
  }

  // Use flowchart format but with network-appropriate styling
  let mermaidCode = 'flowchart TD\n';

  for (const node of nodes) {
    const label = sanitizeLabel(node.Shape.Label);
    // Use different shapes for network elements
    const shapeStart = node.Shape.ShapeType?.includes('server') ? '[(' : '[';
    const shapeEnd = node.Shape.ShapeType?.includes('server') ? ')]' : ']';
    mermaidCode += `  ${node.ID}${shapeStart}"${label}"${shapeEnd}\n`;
  }

  // Add network connections
  for (const edge of edges) {
    const label = edge.Label ? `|${sanitizeLabel(edge.Label)}|` : '';
    mermaidCode += `  ${edge.FromNode} ${label} --> ${edge.ToNode}\n`;
  }

  return mermaidCode;
};

/**
 * Generate Gantt Chart in Mermaid format
 */
const generateGanttDiagram = (diagram: Diagram) => {
  const tasks: any[] = [];
  const sections: Set<string> = new Set();

  // Extract tasks from shapes
  for (const shape of diagram.Shapes) {
    if (!shape.IsEdge && shape.Label) {
      const taskText = sanitizeLabel(shape.Label);
      const section = 'Tasks'; // Default section
      sections.add(section);

      tasks.push({
        section: section,
        name: taskText,
        id: `task_${shape.Id}`,
        start: '2024-01-01',
        duration: '1d',
      });
    }
  }

  let mermaidCode = 'gantt\n';
  mermaidCode += '    title Project Timeline\n';
  mermaidCode += '    dateFormat YYYY-MM-DD\n';

  for (const section of sections) {
    mermaidCode += `    section ${section}\n`;
    const sectionTasks = tasks.filter((t) => t.section === section);

    for (const task of sectionTasks) {
      mermaidCode += `    ${task.name} :${task.id}, ${task.start}, ${task.duration}\n`;
    }
  }

  return mermaidCode;
};

/**
 * Generate Mindmap in Mermaid format
 */
const generateMindmapDiagram = (diagram: Diagram) => {
  const nodes: NodeRecord[] = [];

  for (const shape of diagram.Shapes) {
    if (!shape.IsEdge) {
      nodes.push(shapeToNode(shape));
    }
  }

  let mermaidCode = 'mindmap\n';

  // Find root node (assuming first node or one with most connections)
  const rootNode = nodes[0];
  if (rootNode) {
    const rootLabel = sanitizeLabel(rootNode.Shape.Label);
    mermaidCode += `  root(${rootLabel})\n`;

    // Add other nodes as branches
    for (let i = 1; i < nodes.length; i++) {
      const node = nodes[i];
      const label = sanitizeLabel(node.Shape.Label);
      mermaidCode += `    ${label}\n`;
    }
  }

  return mermaidCode;
};

/**
 * Generate Timeline in Mermaid format
 */
const generateTimelineDiagram = (diagram: Diagram) => {
  const events: any[] = [];

  // Extract timeline events from shapes
  for (const shape of diagram.Shapes) {
    if (!shape.IsEdge && shape.Label) {
      const eventText = sanitizeLabel(shape.Label);
      events.push({
        title: eventText,
        id: `event_${shape.Id}`,
      });
    }
  }

  let mermaidCode = 'timeline\n';
  mermaidCode += '    title Project Timeline\n';

  for (const event of events) {
    mermaidCode += `    ${event.title}\n`;
  }

  return mermaidCode;
};
