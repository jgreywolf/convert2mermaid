import { DiagramDetector } from './DiagramDetector.js';
import { DiagramType, DiagramAnalysis } from './types.js';
import { parseStringPromise } from 'xml2js';

/**
 * DrawIO-specific diagram detection that analyzes raw XML structure
 * before parsing to shapes
 */
export class DrawIODetector extends DiagramDetector {
  /**
   * Analyzes DrawIO XML content for diagram type detection
   */
  public async analyzeDrawIOFile(buffer: Buffer): Promise<DiagramAnalysis> {
    try {
      // First, try to detect from raw XML structure
      const xmlAnalysis = await this.analyzeXMLStructure(buffer);

      // If we get a high-confidence result from XML, return it
      if (xmlAnalysis.confidence >= 80) {
        return xmlAnalysis;
      }

      // Otherwise, fall back to shape-based analysis
      // This would require parsing the shapes first
      return xmlAnalysis; // For now, return XML analysis
    } catch (error) {
      console.error('Error analyzing DrawIO file:', error);
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
   * Analyzes the XML structure for diagram type patterns
   */
  private async analyzeXMLStructure(buffer: Buffer): Promise<DiagramAnalysis> {
    const xmlContent = buffer.toString('utf-8');

    // Quick pattern matching on raw XML
    const patterns = {
      sequence: this.analyzeSequencePatterns(xmlContent),
      class: this.analyzeClassPatterns(xmlContent),
      state: this.analyzeStatePatterns(xmlContent),
      component: this.analyzeComponentPatterns(xmlContent),
      entityRelationship: this.analyzeERPatterns(xmlContent),
      network: this.analyzeNetworkPatterns(xmlContent),
      flowchart: this.analyzeFlowchartPatterns(xmlContent),
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
      metadata: this.extractXMLMetadata(xmlContent),
    };
  }

  /**
   * Sequence diagram pattern detection
   */
  private analyzeSequencePatterns(xml: string) {
    const evidence = [];
    let confidence = 0;

    // Check for UML actor shapes (flexible pattern matching)
    if (xml.includes('shape=umlActor') || xml.includes('shape="umlActor"') || xml.includes("shape='umlActor'")) {
      evidence.push('Found UML actor shapes');
      confidence += 30;
    }

    // Check for lifeline shapes (flexible pattern matching)
    if (
      xml.includes('targetShapes=umlLifeline') ||
      xml.includes('targetShapes="umlLifeline"') ||
      xml.includes("targetShapes='umlLifeline'") ||
      xml.includes('umlLifeline')
    ) {
      evidence.push('Found UML lifeline shapes');
      confidence += 35;
    }

    // Check for sequence-specific text
    const sequenceTerms = ['message', 'call', 'return', 'activate', 'deactivate', 'login', 'validate'];
    for (const term of sequenceTerms) {
      if (xml.toLowerCase().includes(term.toLowerCase())) {
        evidence.push(`Found sequence terminology: ${term}`);
        confidence += 8; // Increased from 5
      }
    }

    // Check for temporal ordering patterns
    if (xml.includes('chronologicallyOrdered')) {
      evidence.push('Found chronological ordering');
      confidence += 20;
    }

    // Check for message flow patterns (arrows between lifelines)
    if (xml.includes('endArrow=block') || xml.includes('endArrow=open')) {
      evidence.push('Found message arrows');
      confidence += 15;
    }

    // Check for dashed lines (return messages)
    if (xml.includes('dashed=1') || xml.includes('dashed="1"')) {
      evidence.push('Found return message patterns');
      confidence += 10;
    }

    return {
      type: DiagramType.SEQUENCE,
      confidence: Math.min(100, confidence),
      evidence,
      weight: confidence,
    };
  }

  /**
   * Class diagram pattern detection
   */
  private analyzeClassPatterns(xml: string) {
    const evidence = [];
    let confidence = 0;

    // Check for UML class shapes (more flexible)
    if (xml.includes('shape=umlClass') || xml.includes('swimlane') || xml.includes('shape="swimlane"')) {
      evidence.push('Found UML class shapes');
      confidence += 40;
    }

    // Check for HTML-formatted class content (common in DrawIO class diagrams)
    if (xml.includes('&lt;hr') && xml.includes('margin:0px')) {
      evidence.push('Found HTML-formatted class content');
      confidence += 35;
    }

    // Check for class notation patterns (|, +, -, #) - look for HTML entities too
    if (
      (xml.includes('|') || xml.includes('&vert;') || xml.includes('&lt;hr')) &&
      (xml.includes('+') || xml.includes('-') || xml.includes('#') || xml.includes('&plus;') || xml.includes('&minus;'))
    ) {
      evidence.push('Found class attribute/method notation');
      confidence += 30;
    }

    // Check for method notation with parentheses and types
    if (
      (xml.includes('()') || xml.includes('&lpar;') || xml.includes('&rpar;')) &&
      (xml.includes(': ') ||
        xml.includes('boolean') ||
        xml.includes('string') ||
        xml.includes('int') ||
        xml.includes('void'))
    ) {
      evidence.push('Found method notation with types');
      confidence += 25;
    }

    // Check for data types commonly used in class diagrams
    const dataTypes = ['int', 'string', 'boolean', 'decimal', 'datetime', 'void'];
    let typeCount = 0;
    for (const type of dataTypes) {
      if (xml.includes(type)) {
        typeCount++;
      }
    }
    if (typeCount >= 2) {
      evidence.push(`Found ${typeCount} data types`);
      confidence += 20;
    }

    // Check for inheritance/association arrows
    if (xml.includes('endArrow=') && (xml.includes('triangle') || xml.includes('diamond') || xml.includes('block'))) {
      evidence.push('Found UML association arrows');
      confidence += 15;
    }

    // Check for multiplicity
    if (xml.includes('1..*') || xml.includes('0..1') || xml.includes('0..*') || xml.includes('*')) {
      evidence.push('Found multiplicity notation');
      confidence += 15;
    }

    // Check for class-related keywords
    const classTerms = ['class', 'interface', 'abstract', 'extends', 'implements'];
    for (const term of classTerms) {
      if (xml.toLowerCase().includes(term)) {
        evidence.push(`Found class terminology: ${term}`);
        confidence += 5;
      }
    }

    return {
      type: DiagramType.CLASS,
      confidence: Math.min(100, confidence),
      evidence,
      weight: confidence,
    };
  }

  /**
   * State diagram pattern detection
   */
  private analyzeStatePatterns(xml: string) {
    const evidence = [];
    let confidence = 0;

    // Check for state shapes
    if (xml.includes('shape=startState') || xml.includes('shape=endState')) {
      evidence.push('Found start/end state shapes');
      confidence += 35;
    }

    // Check for rounded rectangles (common in state diagrams)
    if (xml.includes('rounded=1') || xml.includes('arcSize=')) {
      evidence.push('Found rounded state shapes');
      confidence += 25;
    }

    // Check for state transition notation
    if (xml.includes('[') && xml.includes(']') && xml.includes('/')) {
      evidence.push('Found state transition notation');
      confidence += 30;
    }

    // Check for state keywords
    const stateTerms = ['idle', 'active', 'waiting', 'processing', 'transition'];
    for (const term of stateTerms) {
      if (xml.toLowerCase().includes(term)) {
        evidence.push(`Found state terminology: ${term}`);
        confidence += 5;
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
   * Component diagram pattern detection
   */
  private analyzeComponentPatterns(xml: string) {
    const evidence = [];
    let confidence = 0;

    // Check for component shapes
    if (xml.includes('shape=component') || xml.includes('shape=module')) {
      evidence.push('Found component shapes');
      confidence += 40;
    }

    // Check for interface shapes (ellipses)
    if (xml.includes('shape=ellipse') && xml.includes('interface')) {
      evidence.push('Found interface ellipses');
      confidence += 30;
    }

    // Check for stereotype notation
    if (xml.includes('&lt;&lt;') && xml.includes('&gt;&gt;')) {
      evidence.push('Found stereotype notation');
      confidence += 20;
    }

    // Check for dependency arrows (dashed lines)
    if (xml.includes('dashed=1') || xml.includes('strokeDasharray')) {
      evidence.push('Found dependency relationships');
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
   * Entity Relationship diagram pattern detection
   */
  private analyzeERPatterns(xml: string) {
    const evidence = [];
    let confidence = 0;

    // Check for rectangle entities (but not if they're clearly other types)
    const hasRectangles =
      xml.includes('shape=rectangle') || xml.includes('shape="rectangle"') || xml.includes('shape=table');
    const hasSpecializedShapes = xml.includes('umlActor') || xml.includes('umlClass') || xml.includes('component');

    if (hasRectangles && !hasSpecializedShapes) {
      evidence.push('Found entity rectangles');
      confidence += 35;
    }

    // Check for relationship diamonds
    if (xml.includes('shape=rhombus') || xml.includes('shape="rhombus"') || xml.includes('shape=diamond')) {
      evidence.push('Found relationship diamonds');
      confidence += 35; // Increased weight
    }

    // Check for attribute ellipses (but exclude interface ellipses)
    if ((xml.includes('shape=ellipse') || xml.includes('shape="ellipse"')) && !xml.includes('interface')) {
      evidence.push('Found attribute ellipses');
      confidence += 25;
    }

    // Check for cardinality notation
    if (xml.includes('1:1') || xml.includes('1:M') || xml.includes('M:N') || xml.includes('1:N')) {
      evidence.push('Found cardinality notation');
      confidence += 30; // Increased weight
    }

    // Check for ER-specific keywords
    const erTerms = ['entity', 'relationship', 'attribute', 'primary', 'foreign', 'key', 'table'];
    for (const term of erTerms) {
      if (xml.toLowerCase().includes(term)) {
        evidence.push(`Found ER terminology: ${term}`);
        confidence += 8;
      }
    }

    // Reduce confidence if other specialized patterns are strongly present
    if (xml.includes('umlActor') || xml.includes('targetShapes=umlLifeline')) {
      confidence = Math.max(0, confidence - 30);
    }

    return {
      type: DiagramType.ENTITY_RELATIONSHIP,
      confidence: Math.min(100, confidence),
      evidence,
      weight: confidence,
    };
  }

  /**
   * Network diagram pattern detection
   */
  private analyzeNetworkPatterns(xml: string) {
    const evidence = [];
    let confidence = 0;

    // Check for Cisco shapes namespace
    if (xml.includes('mxgraph.cisco') || xml.includes('cisco')) {
      evidence.push('Found Cisco network shapes');
      confidence += 40;
    }

    // Check for network device keywords
    const networkDevices = ['router', 'switch', 'firewall', 'server', 'hub'];
    for (const device of networkDevices) {
      if (xml.toLowerCase().includes(device)) {
        evidence.push(`Found network device: ${device}`);
        confidence += 10;
      }
    }

    // Check for IP addresses
    const ipPattern = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/;
    if (ipPattern.test(xml)) {
      evidence.push('Found IP addresses');
      confidence += 30;
    }

    // Check for VLAN terminology
    if (xml.toLowerCase().includes('vlan') || xml.toLowerCase().includes('subnet')) {
      evidence.push('Found VLAN/subnet terminology');
      confidence += 20;
    }

    return {
      type: DiagramType.NETWORK,
      confidence: Math.min(100, confidence),
      evidence,
      weight: confidence,
    };
  }

  /**
   * Flowchart pattern detection (fallback)
   */
  private analyzeFlowchartPatterns(xml: string) {
    const evidence = [];
    let confidence = 0;

    // Check for basic flowchart shapes
    if (xml.includes('shape=diamond') || xml.includes('shape=rhombus')) {
      evidence.push('Found decision diamonds');
      confidence += 30;
    }

    if (xml.includes('shape=ellipse')) {
      evidence.push('Found start/end terminals');
      confidence += 25;
    }

    if (xml.includes('shape=rectangle')) {
      evidence.push('Found process rectangles');
      confidence += 20;
    }

    // Check for arrows/flow
    if (xml.includes('endArrow=') || xml.includes('arrow')) {
      evidence.push('Found directional flow');
      confidence += 15;
    }

    // This is the fallback, so reduce confidence if other patterns match
    const hasSpecializedContent =
      xml.includes('uml') || xml.includes('cisco') || xml.includes('actor') || xml.includes('lifeline');
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
   * Extract metadata from XML content
   */
  private extractXMLMetadata(xml: string) {
    // Count mxCell elements for shapes
    const cellMatches = xml.match(/<mxCell/g) || [];
    const edgeMatches = xml.match(/edge="1"/g) || [];

    // Extract shape types from style attributes
    const styleMatches = xml.match(/style="[^"]*"/g) || [];
    const shapeTypes = styleMatches
      .map((style) => {
        const shapeMatch = style.match(/shape=([^;]+)/);
        return shapeMatch ? shapeMatch[1] : null;
      })
      .filter((shape): shape is string => shape !== null);

    return {
      totalShapes: cellMatches.length - edgeMatches.length,
      totalEdges: edgeMatches.length,
      shapeTypes: [...new Set(shapeTypes)],
      hasSpecializedShapes: xml.includes('uml') || xml.includes('cisco'),
      hasDirectionalFlow: xml.includes('endArrow=') || xml.includes('startArrow='),
      hasHierarchy: xml.includes('parent=') && !xml.includes('parent="1"'),
      hasTemporal: xml.toLowerCase().includes('sequence') || xml.toLowerCase().includes('time'),
      hasDataModel: xml.includes('table') || xml.includes('entity'),
      hasNetworkElements: xml.includes('cisco') || xml.includes('network'),
    };
  }
}
