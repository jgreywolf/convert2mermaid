import { DiagramDetector } from './DiagramDetector.js';
import { DiagramType, DiagramAnalysis, DetectionOptions, DetectionPattern } from './types.js';
import { normalizeDrawIOXml } from '../utils/drawioUtils.js';

const DEFAULT_FALLBACK_FLOWCHART_CONFIDENCE = 50;

interface DrawIOCellInfo {
  id: string;
  value: string;
  label: string;
  style: string;
  styleMap: Map<string, string>;
  vertex: boolean;
  edge: boolean;
  source: string;
  target: string;
  parent: string;
}

interface DrawIOAnalysisContext {
  xml: string;
  cells: DrawIOCellInfo[];
  vertices: DrawIOCellInfo[];
  edges: DrawIOCellInfo[];
  labels: string[];
  shapeTypes: string[];
}

/**
 * DrawIO-specific diagram detection that analyzes raw XML structure
 * before parsing to shapes
 */
export class DrawIODetector extends DiagramDetector {
  /**
   * Analyzes DrawIO XML content for diagram type detection
   */
  public async analyzeDrawIOFile(buffer: Buffer, options: DetectionOptions = {}): Promise<DiagramAnalysis> {
    try {
      const xmlContent = normalizeDrawIOXml(buffer.toString('utf-8'));
      if (!xmlContent.includes('<mxfile') || !xmlContent.includes('<mxGraphModel')) {
        return this.createUnknownAnalysis();
      }

      // First, try to detect from raw XML structure
      const xmlAnalysis = await this.analyzeXMLStructure(xmlContent);

      return this.applyFlowchartFallback(xmlAnalysis, options);
    } catch (error) {
      console.error('Error analyzing DrawIO file:', error);
      return this.createUnknownAnalysis();
    }
  }

  private createUnknownAnalysis(): DiagramAnalysis {
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

  /**
   * Analyzes the XML structure for diagram type patterns
   */
  private async analyzeXMLStructure(xmlContent: string): Promise<DiagramAnalysis> {
    const context = this.createAnalysisContext(xmlContent);

    // Analyze structured mxCell fields instead of scanning arbitrary XML text.
    const patterns = {
      sequence: this.analyzeSequencePatterns(context),
      class: this.analyzeClassPatterns(context),
      state: this.analyzeStatePatterns(context),
      component: this.analyzeComponentPatterns(context),
      entityRelationship: this.analyzeERPatterns(context),
      network: this.analyzeNetworkPatterns(context),
      flowchart: this.analyzeFlowchartPatterns(context),
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
      metadata: this.extractXMLMetadata(context),
    };
  }

  private createAnalysisContext(xml: string): DrawIOAnalysisContext {
    const cells = this.extractCells(xml);
    const vertices = cells.filter((cell) => cell.vertex);
    const edges = cells.filter((cell) => cell.edge);

    return {
      xml,
      cells,
      vertices,
      edges,
      labels: cells.map((cell) => cell.label).filter((label) => label.length > 0),
      shapeTypes: [
        ...new Set(
          cells
            .map((cell) => cell.styleMap.get('shape') || this.getImplicitShapeType(cell.style))
            .filter((shape): shape is string => Boolean(shape))
        ),
      ],
    };
  }

  private extractCells(xml: string): DrawIOCellInfo[] {
    const cells: DrawIOCellInfo[] = [];
    const cellMatches = xml.matchAll(/<mxCell\b([^>]*?)(?:\/>|>)/g);

    for (const match of cellMatches) {
      const attrs = this.parseAttributes(match[1]);
      const style = attrs.get('style') || '';
      const value = attrs.get('value') || '';

      cells.push({
        id: attrs.get('id') || '',
        value,
        label: this.decodeLabel(value),
        style,
        styleMap: this.parseStyle(style),
        vertex: attrs.get('vertex') === '1',
        edge: attrs.get('edge') === '1',
        source: attrs.get('source') || '',
        target: attrs.get('target') || '',
        parent: attrs.get('parent') || '',
      });
    }

    return cells;
  }

  private parseAttributes(attributeText: string): Map<string, string> {
    const attrs = new Map<string, string>();
    const matches = attributeText.matchAll(/([\w:-]+)="([^"]*)"/g);

    for (const match of matches) {
      attrs.set(match[1], match[2]);
    }

    return attrs;
  }

  private parseStyle(style: string): Map<string, string> {
    const styleMap = new Map<string, string>();
    for (const part of style.split(';')) {
      if (!part) continue;
      const [key, value] = part.split('=');
      if (key && value !== undefined) {
        styleMap.set(key, value);
      }
    }
    return styleMap;
  }

  private decodeLabel(value: string): string {
    return value
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&#xa;/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<hr\s*\/?>/gi, '\n---\n')
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private getImplicitShapeType(style: string): string {
    const firstStylePart = style.split(';')[0] || '';
    return firstStylePart.includes('=') ? '' : firstStylePart;
  }

  private hasStyle(cell: DrawIOCellInfo, ...patterns: string[]): boolean {
    const style = cell.style.toLowerCase();
    return patterns.some((pattern) => style.includes(pattern.toLowerCase()));
  }

  private hasLabel(context: DrawIOAnalysisContext, pattern: RegExp): boolean {
    return context.labels.some((label) => pattern.test(label));
  }

  /**
   * Sequence diagram pattern detection
   */
  private analyzeSequencePatterns(context: DrawIOAnalysisContext) {
    const evidence = [];
    let confidence = 0;

    const actorShapes = context.vertices.filter((cell) => this.hasStyle(cell, 'shape=umlActor'));
    if (actorShapes.length > 0) {
      evidence.push('Found UML actor shapes');
      confidence += Math.min(35, actorShapes.length * 20);
    }

    const lifelineShapes = context.vertices.filter((cell) => this.hasStyle(cell, 'umlLifeline'));
    if (lifelineShapes.length > 0) {
      evidence.push('Found UML lifeline shapes');
      confidence += Math.min(45, lifelineShapes.length * 20);
    }

    const sequenceTerms = ['message', 'call', 'return', 'activate', 'deactivate', 'login', 'validate'];
    let termCount = 0;
    for (const term of sequenceTerms) {
      if (context.labels.some((label) => label.toLowerCase().includes(term))) {
        termCount++;
      }
    }
    if (termCount > 0) {
      evidence.push(`Found ${termCount} sequence terms`);
      confidence += Math.min(20, termCount * 6);
    }

    if (context.cells.some((cell) => this.hasStyle(cell, 'chronologicallyOrdered'))) {
      evidence.push('Found chronological ordering');
      confidence += 20;
    }

    if (
      (lifelineShapes.length > 0 || actorShapes.length > 0) &&
      context.edges.some((cell) => this.hasStyle(cell, 'endArrow=block', 'endArrow=open'))
    ) {
      evidence.push('Found message arrows');
      confidence += 15;
    }

    if (
      (lifelineShapes.length > 0 || actorShapes.length > 0) &&
      context.edges.some((cell) => this.hasStyle(cell, 'dashed=1'))
    ) {
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
  private analyzeClassPatterns(context: DrawIOAnalysisContext) {
    const evidence = [];
    let confidence = 0;

    const classShapes = context.vertices.filter((cell) => this.hasStyle(cell, 'shape=umlClass', 'swimlane'));
    if (classShapes.length > 0) {
      evidence.push('Found UML class shapes');
      confidence += Math.min(45, classShapes.length * 20);
    }

    const hasClassSections = context.vertices.some((cell) => cell.value.includes('&lt;hr') || cell.label.includes('---'));
    if (hasClassSections) {
      evidence.push('Found HTML-formatted class content');
      confidence += 35;
    }

    if (this.hasLabel(context, /(^|\s)[+#-]\w|\w+\([^)]*\)/)) {
      evidence.push('Found class attribute/method notation');
      confidence += 25;
    }

    if (this.hasLabel(context, /\([^)]*\).*(boolean|string|int|void)|:\s*(boolean|string|int|void)/i)) {
      evidence.push('Found method notation with types');
      confidence += 25;
    }

    const dataTypes = ['int', 'string', 'boolean', 'decimal', 'datetime', 'void'];
    const typeCount = dataTypes.filter((type) => context.labels.some((label) => label.toLowerCase().includes(type))).length;
    if (typeCount >= 2) {
      evidence.push(`Found ${typeCount} data types`);
      confidence += 20;
    }

    if (context.edges.some((cell) => this.hasStyle(cell, 'endArrow=block', 'endArrow=diamond', 'endArrow=diamondThin', 'endArrow=openThin'))) {
      evidence.push('Found UML association arrows');
      confidence += 15;
    }

    if (this.hasLabel(context, /\b(0\.\.\*|1\.\.\*|0\.\.1|1)\b|\*/)) {
      evidence.push('Found multiplicity notation');
      confidence += 15;
    }

    const classTerms = ['class', 'interface', 'abstract', 'extends', 'implements'];
    const termCount = classTerms.filter((term) => context.labels.some((label) => label.toLowerCase().includes(term))).length;
    if (termCount > 0) {
      evidence.push(`Found ${termCount} class terms`);
      confidence += Math.min(10, termCount * 3);
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
  private analyzeStatePatterns(context: DrawIOAnalysisContext) {
    const evidence = [];
    let confidence = 0;

    if (context.vertices.some((cell) => this.hasStyle(cell, 'shape=startState', 'shape=endState'))) {
      evidence.push('Found start/end state shapes');
      confidence += 45;
    }

    const roundedStates = context.vertices.filter((cell) => this.hasStyle(cell, 'rounded=1', 'arcSize='));
    if (roundedStates.length >= 3) {
      evidence.push('Found rounded state shapes');
      confidence += Math.min(25, roundedStates.length * 5);
    }

    if (context.labels.some((label) => /(\[[^\]]+\]\s*\/|\S+\s*\/\s*\S+|when\s+)/i.test(label))) {
      evidence.push('Found state transition notation');
      confidence += 30;
    }

    const stateTerms = ['idle', 'active', 'waiting', 'processing', 'transition'];
    const termCount = stateTerms.filter((term) => context.labels.some((label) => label.toLowerCase().includes(term))).length;
    if (termCount > 0) {
      evidence.push(`Found ${termCount} state terms`);
      confidence += Math.min(15, termCount * 4);
    }

    return {
      type: DiagramType.STATE,
      confidence: Math.min(100, confidence),
      evidence,
      weight: confidence,
    };
  }

  private applyFlowchartFallback(analysis: DiagramAnalysis, options: DetectionOptions): DiagramAnalysis {
    const threshold = options.drawioFallbackFlowchartConfidence ?? DEFAULT_FALLBACK_FLOWCHART_CONFIDENCE;

    if (analysis.detectedType === DiagramType.FLOWCHART && analysis.confidence > 0) {
      return analysis;
    }

    if (analysis.detectedType !== DiagramType.UNKNOWN && analysis.confidence >= threshold) {
      return analysis;
    }

    const flowchartPattern = analysis.patterns.find((pattern) => pattern.type === DiagramType.FLOWCHART);
    const fallbackPattern: DetectionPattern = flowchartPattern || {
      type: DiagramType.FLOWCHART,
      evidence: [`Fallback to flowchart because detection confidence was below ${threshold}%`],
      weight: threshold,
      confidence: Math.max(analysis.confidence, threshold),
    };

    return {
      ...analysis,
      detectedType: DiagramType.FLOWCHART,
      confidence: fallbackPattern.confidence,
      patterns: analysis.patterns.some((pattern) => pattern.type === DiagramType.FLOWCHART)
        ? analysis.patterns
        : [...analysis.patterns, fallbackPattern],
    };
  }

  /**
   * Component diagram pattern detection
   */
  private analyzeComponentPatterns(context: DrawIOAnalysisContext) {
    const evidence = [];
    let confidence = 0;

    const componentShapes = context.vertices.filter((cell) => this.hasStyle(cell, 'shape=component', 'shape=module'));
    if (componentShapes.length > 0) {
      evidence.push('Found component shapes');
      confidence += Math.min(45, componentShapes.length * 15);
    }

    if (
      context.vertices.some((cell) => this.hasStyle(cell, 'ellipse') && cell.label.toLowerCase().includes('interface'))
    ) {
      evidence.push('Found interface ellipses');
      confidence += 20;
    }

    if (this.hasLabel(context, /<<\s*(component|interface|module)\s*>>/i)) {
      evidence.push('Found stereotype notation');
      confidence += 30;
    }

    if (context.edges.some((cell) => this.hasStyle(cell, 'dashed=1', 'strokeDasharray') || /depends|uses/i.test(cell.label))) {
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
  private analyzeERPatterns(context: DrawIOAnalysisContext) {
    const evidence = [];
    let confidence = 0;

    const relationships = context.vertices.filter((cell) => this.hasStyle(cell, 'shape=rhombus', 'shape=diamond'));
    const attributes = context.vertices.filter(
      (cell) => this.hasStyle(cell, 'ellipse') && !cell.label.toLowerCase().includes('interface')
    );
    const tables = context.vertices.filter((cell) => this.hasStyle(cell, 'shape=table', 'shape=partialRectangle'));
    const chenEntities = context.vertices.filter(
      (cell) =>
        !cell.edge &&
        !relationships.includes(cell) &&
        !attributes.includes(cell) &&
        this.hasStyle(cell, 'whiteSpace=wrap', 'align=center') &&
        cell.label.length > 0
    );

    if (tables.length > 0) {
      evidence.push('Found table/entity shapes');
      confidence += Math.min(40, tables.length * 20);
    }

    if (chenEntities.length >= 2 && relationships.length > 0) {
      evidence.push('Found Chen-style entity rectangles');
      confidence += Math.min(35, chenEntities.length * 8);
    }

    if (relationships.length > 0) {
      evidence.push('Found relationship diamonds');
      confidence += Math.min(35, relationships.length * 20);
    }

    if (attributes.length > 0 && (tables.length > 0 || relationships.length > 0)) {
      evidence.push('Found attribute ellipses');
      confidence += Math.min(25, attributes.length * 8);
    }

    if (this.hasLabel(context, /\b(1:1|1:M|M:N|1:N|one to many|many to many|[MNP])\b/i)) {
      evidence.push('Found cardinality notation');
      confidence += 30;
    }

    const erTerms = ['entity', 'relationship', 'attribute', 'primary', 'foreign', 'key', 'table'];
    const termCount = erTerms.filter((term) => context.labels.some((label) => label.toLowerCase().includes(term))).length;
    if (termCount > 0) {
      evidence.push(`Found ${termCount} ER terms`);
      confidence += Math.min(20, termCount * 5);
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
  private analyzeNetworkPatterns(context: DrawIOAnalysisContext) {
    const evidence = [];
    let confidence = 0;

    const ciscoShapes = context.vertices.filter((cell) => this.hasStyle(cell, 'mxgraph.cisco', 'cisco.'));
    if (ciscoShapes.length > 0) {
      evidence.push('Found Cisco network shapes');
      confidence += Math.min(45, ciscoShapes.length * 20);
    }

    const networkDevices = ['router', 'switch', 'firewall', 'server', 'hub'];
    let deviceCount = 0;
    for (const device of networkDevices) {
      if (context.labels.some((label) => label.toLowerCase().includes(device))) {
        deviceCount++;
      }
    }
    if (deviceCount > 0) {
      evidence.push(`Found ${deviceCount} network device labels`);
      confidence += Math.min(25, deviceCount * 8);
    }

    const ipPattern = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/;
    if (context.labels.some((label) => ipPattern.test(label))) {
      evidence.push('Found IP addresses');
      confidence += 30;
    }

    if (this.hasLabel(context, /\b(vlan|subnet)\b/i)) {
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
  private analyzeFlowchartPatterns(context: DrawIOAnalysisContext) {
    const evidence = [];
    let confidence = 0;

    if (context.vertices.some((cell) => this.hasStyle(cell, 'shape=diamond', 'shape=rhombus'))) {
      evidence.push('Found decision diamonds');
      confidence += 30;
    }

    if (context.vertices.some((cell) => this.hasStyle(cell, 'ellipse'))) {
      evidence.push('Found start/end terminals');
      confidence += 25;
    }

    if (
      context.vertices.some((cell) =>
        this.hasStyle(cell, 'shape=rectangle', 'shape=process', 'rounded=0', 'whiteSpace=wrap')
      )
    ) {
      evidence.push('Found process rectangles');
      confidence += 20;
    }

    if (context.edges.some((cell) => this.hasStyle(cell, 'endArrow=', 'startArrow=')) || context.edges.length > 0) {
      evidence.push('Found directional flow');
      confidence += 15;
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
  private extractXMLMetadata(context: DrawIOAnalysisContext) {
    return {
      totalShapes: context.vertices.length,
      totalEdges: context.edges.length,
      shapeTypes: context.shapeTypes,
      hasSpecializedShapes: context.cells.some((cell) => this.hasStyle(cell, 'uml', 'cisco', 'component')),
      hasDirectionalFlow: context.edges.some((cell) => this.hasStyle(cell, 'endArrow=', 'startArrow=')),
      hasHierarchy: context.cells.some((cell) => cell.parent && cell.parent !== '0' && cell.parent !== '1'),
      hasTemporal: this.hasLabel(context, /\b(sequence|time|activate|deactivate)\b/i),
      hasDataModel: this.hasLabel(context, /\b(table|entity|attribute|key)\b/i),
      hasNetworkElements:
        context.cells.some((cell) => this.hasStyle(cell, 'cisco', 'network')) ||
        this.hasLabel(context, /\b(router|switch|server|firewall)\b/i),
    };
  }
}
