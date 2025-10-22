import { Diagram } from './types.js';
import { DiagramType } from './detection/types.js';

// Import diagram generators
import { generateFlowchartDiagram } from './generators/flowchartGenerator.js';
import { generateClassDiagram } from './generators/classGenerator.js';
import { generateSequenceDiagram } from './generators/sequenceGenerator.js';
import { generateStateDiagram } from './generators/stateGenerator.js';
import { generateERDiagram } from './generators/erGenerator.js';
import { generateComponentDiagram } from './generators/componentGenerator.js';
import { generateNetworkDiagram } from './generators/networkGenerator.js';
import { generateGanttDiagram } from './generators/ganttGenerator.js';
import { generateMindmapDiagram } from './generators/mindmapGenerator.js';
import { generateTimelineDiagram } from './generators/timelineGenerator.js';

/**
 * Main entry point for generating Mermaid code from diagram data.
 * Routes to appropriate diagram-specific generator based on detected diagram type.
 */
export const generateMermaidCode = (diagram: Diagram): string => {
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
