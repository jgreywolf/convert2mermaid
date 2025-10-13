import { DiagramDetector } from './DiagramDetector.js';
import { DiagramType, DiagramAnalysis } from './types.js';

/**
 * PlantUML-specific diagram detection that analyzes text content
 */
export class PlantUMLDetector extends DiagramDetector {
  /**
   * Analyzes PlantUML text content for diagram type detection
   */
  public analyzePlantUMLFile(buffer: Buffer): DiagramAnalysis {
    try {
      const content = buffer.toString('utf-8');
      return this.analyzeTextContent(content);
    } catch (error) {
      console.error('Error analyzing PlantUML file:', error);
      return {
        detectedType: DiagramType.UNKNOWN,
        confidence: 0,
        patterns: [],
        metadata: {
          totalShapes: 0,
          totalEdges: 0,
          shapeTypes: [],
          hasSpecializedShapes: false,
          hasDirectionalFlow: false,
          hasHierarchy: false,
          hasTemporal: false,
          hasDataModel: false,
          hasNetworkElements: false,
        },
      };
    }
  }

  /**
   * Analyzes PlantUML text content for diagram type patterns
   */
  private analyzeTextContent(content: string): DiagramAnalysis {
    const lines = content.split('\n').map((line) => line.trim());

    // PlantUML has explicit diagram type declarations
    const explicitType = this.detectExplicitType(lines);
    if (explicitType.confidence >= 95) {
      return {
        detectedType: explicitType.type,
        confidence: explicitType.confidence,
        patterns: [
          {
            type: explicitType.type,
            evidence: explicitType.evidence,
            weight: explicitType.weight,
            confidence: explicitType.confidence,
          },
        ],
        metadata: this.extractTextMetadata(content),
      };
    }

    // Fall back to content analysis
    const patterns = {
      sequence: this.analyzeSequenceContent(content),
      class: this.analyzeClassContent(content),
      state: this.analyzeStateContent(content),
      component: this.analyzeComponentContent(content),
      entityRelationship: this.analyzeERContent(content),
      network: this.analyzeNetworkContent(content),
      flowchart: this.analyzeFlowchartContent(content),
    };

    // Find the pattern with highest confidence
    let bestMatch = { type: DiagramType.UNKNOWN, confidence: 0 };
    const detectedPatterns = [];

    for (const [patternName, result] of Object.entries(patterns)) {
      if (result.confidence > bestMatch.confidence) {
        bestMatch = {
          type: result.type,
          confidence: result.confidence,
        };
      }

      if (result.confidence > 0) {
        detectedPatterns.push({
          type: result.type,
          evidence: result.evidence,
          weight: result.weight,
          confidence: result.confidence,
        });
      }
    }

    return {
      detectedType: bestMatch.type,
      confidence: bestMatch.confidence,
      patterns: detectedPatterns,
      metadata: this.extractTextMetadata(content),
    };
  }

  /**
   * Detect explicit PlantUML diagram type declarations
   */
  private detectExplicitType(lines: string[]) {
    const evidence = [];
    let detectedType = DiagramType.UNKNOWN;
    let confidence = 0;

    for (const line of lines) {
      const lowerLine = line.toLowerCase();

      if (lowerLine.includes('@startuml')) {
        evidence.push('Found @startuml directive');
        confidence += 20;
      }

      if (lowerLine.includes('@startsequence') || lowerLine.includes('!define sequence')) {
        detectedType = DiagramType.SEQUENCE;
        confidence = 95;
        evidence.push('Found explicit sequence diagram directive');
        break;
      }

      if (lowerLine.includes('@startclass') || lowerLine.includes('class ')) {
        detectedType = DiagramType.CLASS;
        confidence = 95;
        evidence.push('Found explicit class diagram directive');
        break;
      }

      if (lowerLine.includes('@startstate') || lowerLine.includes('state ')) {
        detectedType = DiagramType.STATE;
        confidence = 95;
        evidence.push('Found explicit state diagram directive');
        break;
      }

      if (lowerLine.includes('@startcomponent') || lowerLine.includes('component ')) {
        detectedType = DiagramType.COMPONENT;
        confidence = 95;
        evidence.push('Found explicit component diagram directive');
        break;
      }

      if (lowerLine.includes('@startgantt')) {
        detectedType = DiagramType.GANTT;
        confidence = 95;
        evidence.push('Found explicit Gantt diagram directive');
        break;
      }

      if (lowerLine.includes('@startmindmap')) {
        detectedType = DiagramType.MINDMAP;
        confidence = 95;
        evidence.push('Found explicit mindmap directive');
        break;
      }
    }

    return {
      type: detectedType,
      confidence,
      evidence,
      weight: confidence,
    };
  }

  /**
   * Analyze sequence diagram patterns in PlantUML
   */
  private analyzeSequenceContent(content: string) {
    const evidence = [];
    let confidence = 0;

    // Check for participant declarations
    if (content.includes('participant ') || content.includes('actor ')) {
      evidence.push('Found participant/actor declarations');
      confidence += 35;
    }

    // Check for message arrows
    if (content.includes('->') || content.includes('<-') || content.includes('-->')) {
      evidence.push('Found message arrows');
      confidence += 30;
    }

    // Check for activation/deactivation
    if (content.includes('activate ') || content.includes('deactivate ')) {
      evidence.push('Found activation/deactivation');
      confidence += 25;
    }

    // Check for sequence-specific keywords
    const sequenceKeywords = ['note over', 'note left', 'note right', 'alt', 'else', 'opt', 'loop'];
    for (const keyword of sequenceKeywords) {
      if (content.includes(keyword)) {
        evidence.push(`Found sequence keyword: ${keyword}`);
        confidence += 5;
      }
    }

    return {
      type: DiagramType.SEQUENCE,
      confidence: Math.min(100, confidence),
      evidence,
      weight: confidence,
    };
  }

  /**
   * Analyze class diagram patterns in PlantUML
   */
  private analyzeClassContent(content: string) {
    const evidence = [];
    let confidence = 0;

    // Check for class declarations
    if (content.includes('class ') || content.includes('interface ') || content.includes('abstract ')) {
      evidence.push('Found class/interface declarations');
      confidence += 40;
    }

    // Check for inheritance/implementation
    if (content.includes(' extends ') || content.includes(' implements ') || content.includes(' <|-- ')) {
      evidence.push('Found inheritance/implementation relationships');
      confidence += 30;
    }

    // Check for associations
    if (content.includes(' -- ') || content.includes(' o-- ') || content.includes(' *-- ')) {
      evidence.push('Found association relationships');
      confidence += 25;
    }

    // Check for method/attribute notation
    if (content.includes('+') || content.includes('-') || content.includes('#') || content.includes('()')) {
      evidence.push('Found method/attribute visibility notation');
      confidence += 20;
    }

    return {
      type: DiagramType.CLASS,
      confidence: Math.min(100, confidence),
      evidence,
      weight: confidence,
    };
  }

  /**
   * Analyze state diagram patterns in PlantUML
   */
  private analyzeStateContent(content: string) {
    const evidence = [];
    let confidence = 0;

    // Check for state declarations
    if (content.includes('state ') || content.includes('[*]')) {
      evidence.push('Found state declarations');
      confidence += 35;
    }

    // Check for state transitions
    if (content.includes(' --> ') || content.includes(' : ')) {
      evidence.push('Found state transitions');
      confidence += 30;
    }

    // Check for composite states
    if (content.includes('state ') && content.includes(' {')) {
      evidence.push('Found composite states');
      confidence += 25;
    }

    // Check for state keywords
    const stateKeywords = ['entry', 'exit', 'do'];
    for (const keyword of stateKeywords) {
      if (content.includes(keyword + ' /')) {
        evidence.push(`Found state keyword: ${keyword}`);
        confidence += 10;
      }
    }

    return {
      type: DiagramType.STATE,
      confidence: Math.min(100, confidence),
      evidence,
      weight: confidence,
    };
  }

  /**
   * Analyze component diagram patterns in PlantUML
   */
  private analyzeComponentContent(content: string) {
    const evidence = [];
    let confidence = 0;

    // Check for component declarations
    if (content.includes('component ') || content.includes('package ')) {
      evidence.push('Found component/package declarations');
      confidence += 40;
    }

    // Check for interfaces
    if (content.includes('interface ') || content.includes('() ')) {
      evidence.push('Found interface declarations');
      confidence += 30;
    }

    // Check for dependencies
    if (content.includes('..>') || content.includes('-->')) {
      evidence.push('Found dependency relationships');
      confidence += 25;
    }

    // Check for stereotypes
    if (content.includes('<<') && content.includes('>>')) {
      evidence.push('Found stereotype notation');
      confidence += 15;
    }

    return {
      type: DiagramType.COMPONENT,
      confidence: Math.min(100, confidence),
      evidence,
      weight: confidence,
    };
  }

  /**
   * Analyze ER diagram patterns in PlantUML
   */
  private analyzeERContent(content: string) {
    const evidence = [];
    let confidence = 0;

    // Check for entity declarations
    if (content.includes('entity ') || content.includes('table ')) {
      evidence.push('Found entity/table declarations');
      confidence += 40;
    }

    // Check for relationships
    if (content.includes('||--||') || content.includes('}|--||') || content.includes('||--o{')) {
      evidence.push('Found ER relationship notation');
      confidence += 35;
    }

    // Check for cardinality
    if (content.includes('one to one') || content.includes('one to many') || content.includes('many to many')) {
      evidence.push('Found cardinality notation');
      confidence += 25;
    }

    return {
      type: DiagramType.ENTITY_RELATIONSHIP,
      confidence: Math.min(100, confidence),
      evidence,
      weight: confidence,
    };
  }

  /**
   * Analyze network diagram patterns in PlantUML
   */
  private analyzeNetworkContent(content: string) {
    const evidence = [];
    let confidence = 0;

    // Check for network elements
    const networkKeywords = ['router', 'switch', 'server', 'firewall', 'hub', 'gateway'];
    for (const keyword of networkKeywords) {
      if (content.toLowerCase().includes(keyword)) {
        evidence.push(`Found network element: ${keyword}`);
        confidence += 15;
      }
    }

    // Check for IP addresses
    const ipPattern = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/;
    if (ipPattern.test(content)) {
      evidence.push('Found IP addresses');
      confidence += 25;
    }

    // Check for network protocols
    const protocols = ['tcp', 'udp', 'http', 'https', 'ftp', 'ssh'];
    for (const protocol of protocols) {
      if (content.toLowerCase().includes(protocol)) {
        evidence.push(`Found network protocol: ${protocol}`);
        confidence += 10;
      }
    }

    return {
      type: DiagramType.NETWORK,
      confidence: Math.min(100, confidence),
      evidence,
      weight: confidence,
    };
  }

  /**
   * Analyze flowchart patterns in PlantUML (fallback)
   */
  private analyzeFlowchartContent(content: string) {
    const evidence = [];
    let confidence = 0;

    // Check for activity/flowchart notation
    if (content.includes(':') && content.includes(';')) {
      evidence.push('Found activity notation');
      confidence += 30;
    }

    // Check for decision points
    if (content.includes('if (') || content.includes('while (')) {
      evidence.push('Found decision points');
      confidence += 25;
    }

    // Check for start/end
    if (content.includes('start') || content.includes('stop') || content.includes('end')) {
      evidence.push('Found start/end points');
      confidence += 20;
    }

    // Reduce confidence if specialized content is found
    const hasSpecializedContent =
      content.includes('class ') ||
      content.includes('participant ') ||
      content.includes('state ') ||
      content.includes('component ');
    if (hasSpecializedContent) {
      confidence = Math.max(0, confidence - 20);
    }

    return {
      type: DiagramType.FLOWCHART,
      confidence: Math.min(100, confidence),
      evidence,
      weight: confidence,
    };
  }

  /**
   * Extract metadata from PlantUML content
   */
  private extractTextMetadata(content: string) {
    const lines = content.split('\n').filter((line) => line.trim().length > 0);

    // Count arrows for edges
    const arrows = ['->', '<-', '-->', '<--', '..>', '<..', '||--||', '}|--||'];
    let edgeCount = 0;
    for (const arrow of arrows) {
      edgeCount += (content.match(new RegExp(arrow.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
    }

    // Estimate shapes (lines that aren't comments, directives, or edges)
    const shapeLines = lines.filter(
      (line) =>
        !line.startsWith('@') &&
        !line.startsWith('!') &&
        !line.startsWith("'") &&
        !arrows.some((arrow) => line.includes(arrow))
    );

    return {
      totalShapes: shapeLines.length,
      totalEdges: edgeCount,
      shapeTypes: ['plantuml'], // PlantUML uses text-based notation
      hasSpecializedShapes: content.includes('class ') || content.includes('participant '),
      hasDirectionalFlow: content.includes('->') || content.includes('-->'),
      hasHierarchy: content.includes('extends ') || content.includes('implements '),
      hasTemporal: content.includes('activate ') || content.includes('deactivate '),
      hasDataModel: content.includes('entity ') || content.includes('table '),
      hasNetworkElements: /router|switch|server|firewall/i.test(content),
    };
  }
}
