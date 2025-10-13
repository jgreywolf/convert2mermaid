import {
  DiagramType,
  DiagramAnalysis,
  DiagramMetadata,
  DetectionPattern,
  DetectionRule,
  PatternMatcher,
  DetectionResult,
} from './types.js';
import { Shape } from '../types.js';

/**
 * Core diagram type detection engine
 */
export class DiagramDetector {
  private rules: DetectionRule[] = [];

  constructor() {
    this.initializeRules();
  }

  /**
   * Analyzes a diagram and returns the detected type with confidence
   */
  public analyze(shapes: Shape[]): DiagramAnalysis {
    const metadata = this.extractMetadata(shapes);
    const patterns: DetectionPattern[] = [];
    let bestMatch: { type: DiagramType; confidence: number } = {
      type: DiagramType.UNKNOWN,
      confidence: 0,
    };

    // Test each rule
    for (const rule of this.rules) {
      const ruleResult = this.evaluateRule(rule, shapes, metadata);

      if (ruleResult.confidence > 0) {
        patterns.push({
          type: rule.type,
          evidence: ruleResult.evidence,
          weight: ruleResult.weight,
          confidence: ruleResult.confidence,
        });

        if (ruleResult.confidence > bestMatch.confidence) {
          bestMatch = { type: rule.type, confidence: ruleResult.confidence };
        }
      }
    }

    return {
      detectedType: bestMatch.type,
      confidence: bestMatch.confidence,
      patterns,
      metadata,
    };
  }

  /**
   * Extracts metadata from shapes for analysis
   */
  private extractMetadata(shapes: Shape[]): DiagramMetadata {
    const edges = shapes.filter((s) => s.IsEdge);
    const nodes = shapes.filter((s) => !s.IsEdge);
    const shapeTypes = [...new Set(shapes.map((s) => s.ShapeType))];

    return {
      totalShapes: nodes.length,
      totalEdges: edges.length,
      shapeTypes,
      hasSpecializedShapes: this.hasSpecializedShapes(shapeTypes),
      hasDirectionalFlow: this.hasDirectionalFlow(edges),
      hasHierarchy: this.hasHierarchy(shapes),
      hasTemporal: this.hasTemporal(shapes),
      hasDataModel: this.hasDataModel(shapeTypes),
      hasNetworkElements: this.hasNetworkElements(shapeTypes),
    };
  }

  /**
   * Evaluates a single detection rule
   */
  private evaluateRule(
    rule: DetectionRule,
    shapes: Shape[],
    metadata: DiagramMetadata
  ): { confidence: number; evidence: string[]; weight: number } {
    let totalWeight = 0;
    let totalScore = 0;
    const evidence: string[] = [];

    for (const pattern of rule.patterns) {
      const result = pattern.matcher(shapes, metadata);
      if (result.matches) {
        totalScore += result.confidence * pattern.weight;
        totalWeight += pattern.weight;
        evidence.push(...result.evidence);
      }
    }

    const confidence = totalWeight > 0 ? totalScore / totalWeight : 0;

    return {
      confidence: confidence >= rule.minimumConfidence ? confidence : 0,
      evidence,
      weight: totalWeight,
    };
  }

  /**
   * Initialize detection rules for each diagram type
   */
  private initializeRules(): void {
    this.rules = [
      this.createSequenceRule(),
      this.createClassRule(),
      this.createStateRule(),
      this.createComponentRule(),
      this.createEntityRelationshipRule(),
      this.createNetworkRule(),
      this.createFlowchartRule(), // Keep flowchart last as it's most generic
    ];
  }

  /**
   * Sequence diagram detection rule
   */
  private createSequenceRule(): DetectionRule {
    return {
      type: DiagramType.SEQUENCE,
      minimumConfidence: 60,
      patterns: [
        {
          name: 'uml-actors',
          weight: 30,
          matcher: (shapes, metadata) => {
            const actorShapes = shapes.filter(
              (s) =>
                s.ShapeType.includes('umlActor') ||
                s.ShapeType.includes('actor') ||
                s.Label.toLowerCase().includes('actor')
            );
            return {
              matches: actorShapes.length > 0,
              confidence: Math.min(100, actorShapes.length * 25),
              evidence: [`Found ${actorShapes.length} actor shapes`],
            };
          },
        },
        {
          name: 'lifelines',
          weight: 35,
          matcher: (shapes, metadata) => {
            const lifelines = shapes.filter(
              (s) =>
                s.ShapeType.includes('lifeline') ||
                s.ShapeType.includes('Lifeline') ||
                shapes.some((edge) => edge.FromNode === s.Id && edge.ToNode !== s.Id)
            );
            return {
              matches: lifelines.length > 1,
              confidence: Math.min(100, lifelines.length * 20),
              evidence: [`Found ${lifelines.length} potential lifelines`],
            };
          },
        },
        {
          name: 'message-flows',
          weight: 25,
          matcher: (shapes, metadata) => {
            const horizontalEdges = shapes.filter(
              (s) => s.IsEdge && (s.Label.includes('call') || s.Label.includes('message') || s.Label.includes(':'))
            );
            return {
              matches: horizontalEdges.length > 0,
              confidence: Math.min(100, horizontalEdges.length * 15),
              evidence: [`Found ${horizontalEdges.length} message flows`],
            };
          },
        },
        {
          name: 'temporal-keywords',
          weight: 10,
          matcher: (shapes, metadata) => {
            const temporalTerms = ['activate', 'deactivate', 'create', 'destroy', 'call', 'return', 'response'];
            const hasTemporalTerms = shapes.some((s) =>
              temporalTerms.some((term) => s.Label.toLowerCase().includes(term))
            );
            return {
              matches: hasTemporalTerms,
              confidence: 80,
              evidence: ['Found temporal keywords in labels'],
            };
          },
        },
      ],
    };
  }

  /**
   * Class diagram detection rule
   */
  private createClassRule(): DetectionRule {
    return {
      type: DiagramType.CLASS,
      minimumConfidence: 65,
      patterns: [
        {
          name: 'class-shapes',
          weight: 40,
          matcher: (shapes, metadata) => {
            const classShapes = shapes.filter(
              (s) =>
                s.ShapeType.includes('class') ||
                s.ShapeType.includes('Class') ||
                s.ShapeType.includes('swimlane') ||
                (s.Label.includes('|') && s.Label.includes('-')) // Class notation
            );
            return {
              matches: classShapes.length > 0,
              confidence: Math.min(100, classShapes.length * 30),
              evidence: [`Found ${classShapes.length} class-like shapes`],
            };
          },
        },
        {
          name: 'attributes-methods',
          weight: 30,
          matcher: (shapes, metadata) => {
            const hasAttributes = shapes.some(
              (s) =>
                s.Label.includes('|') ||
                s.Label.includes('+') ||
                s.Label.includes('-') ||
                s.Label.includes('#') ||
                s.Label.includes('()')
            );
            return {
              matches: hasAttributes,
              confidence: 90,
              evidence: ['Found class attributes/methods notation'],
            };
          },
        },
        {
          name: 'associations',
          weight: 20,
          matcher: (shapes, metadata) => {
            const associations = shapes.filter(
              (s) => s.IsEdge && (s.Label.includes('*') || s.Label.includes('1') || s.Label.includes('0..'))
            );
            return {
              matches: associations.length > 0,
              confidence: Math.min(100, associations.length * 25),
              evidence: [`Found ${associations.length} associations with multiplicity`],
            };
          },
        },
        {
          name: 'inheritance',
          weight: 10,
          matcher: (shapes, metadata) => {
            const inheritance = shapes.filter(
              (s) => s.IsEdge && (s.ShapeType.includes('inheritance') || s.ShapeType.includes('Inheritance'))
            );
            return {
              matches: inheritance.length > 0,
              confidence: 95,
              evidence: [`Found ${inheritance.length} inheritance relationships`],
            };
          },
        },
      ],
    };
  }

  /**
   * State diagram detection rule
   */
  private createStateRule(): DetectionRule {
    return {
      type: DiagramType.STATE,
      minimumConfidence: 70,
      patterns: [
        {
          name: 'start-end-states',
          weight: 35,
          matcher: (shapes, metadata) => {
            const startStates = shapes.filter(
              (s) =>
                s.ShapeType.includes('startState') ||
                s.ShapeType.includes('initialState') ||
                s.Label.toLowerCase().includes('start')
            );
            const endStates = shapes.filter(
              (s) =>
                s.ShapeType.includes('endState') ||
                s.ShapeType.includes('finalState') ||
                s.Label.toLowerCase().includes('end')
            );
            return {
              matches: startStates.length > 0 || endStates.length > 0,
              confidence: 90,
              evidence: [`Found ${startStates.length} start and ${endStates.length} end states`],
            };
          },
        },
        {
          name: 'rounded-rectangles',
          weight: 25,
          matcher: (shapes, metadata) => {
            const roundedShapes = shapes.filter((s) => !s.IsEdge && s.Style.Rounding > 0);
            return {
              matches: roundedShapes.length > 2,
              confidence: Math.min(100, roundedShapes.length * 15),
              evidence: [`Found ${roundedShapes.length} rounded state shapes`],
            };
          },
        },
        {
          name: 'transitions',
          weight: 30,
          matcher: (shapes, metadata) => {
            const transitions = shapes.filter(
              (s) => s.IsEdge && (s.Label.includes('/') || s.Label.includes('[') || s.Label.includes('when'))
            );
            return {
              matches: transitions.length > 0,
              confidence: Math.min(100, transitions.length * 20),
              evidence: [`Found ${transitions.length} state transitions with triggers`],
            };
          },
        },
        {
          name: 'state-keywords',
          weight: 10,
          matcher: (shapes, metadata) => {
            const stateTerms = ['idle', 'active', 'waiting', 'processing', 'complete', 'error'];
            const hasStateTerms = shapes.some((s) => stateTerms.some((term) => s.Label.toLowerCase().includes(term)));
            return {
              matches: hasStateTerms,
              confidence: 75,
              evidence: ['Found state-related keywords'],
            };
          },
        },
      ],
    };
  }

  /**
   * Component diagram detection rule
   */
  private createComponentRule(): DetectionRule {
    return {
      type: DiagramType.COMPONENT,
      minimumConfidence: 60,
      patterns: [
        {
          name: 'component-shapes',
          weight: 40,
          matcher: (shapes, metadata) => {
            const components = shapes.filter(
              (s) =>
                s.ShapeType.includes('component') ||
                s.ShapeType.includes('module') ||
                s.Label.includes('<<component>>') ||
                s.Label.includes('<<module>>')
            );
            return {
              matches: components.length > 0,
              confidence: Math.min(100, components.length * 25),
              evidence: [`Found ${components.length} component shapes`],
            };
          },
        },
        {
          name: 'interfaces',
          weight: 30,
          matcher: (shapes, metadata) => {
            const interfaces = shapes.filter(
              (s) =>
                s.ShapeType.includes('interface') ||
                s.ShapeType.includes('ellipse') ||
                s.Label.includes('<<interface>>')
            );
            return {
              matches: interfaces.length > 0,
              confidence: Math.min(100, interfaces.length * 20),
              evidence: [`Found ${interfaces.length} interface elements`],
            };
          },
        },
        {
          name: 'dependencies',
          weight: 20,
          matcher: (shapes, metadata) => {
            const dependencies = shapes.filter(
              (s) => s.IsEdge && (s.Style.LinePattern === 2 || s.Label.includes('depends') || s.Label.includes('uses'))
            );
            return {
              matches: dependencies.length > 0,
              confidence: Math.min(100, dependencies.length * 15),
              evidence: [`Found ${dependencies.length} dependency relationships`],
            };
          },
        },
        {
          name: 'stereotypes',
          weight: 10,
          matcher: (shapes, metadata) => {
            const hasStereotypes = shapes.some((s) => s.Label.includes('<<') && s.Label.includes('>>'));
            return {
              matches: hasStereotypes,
              confidence: 85,
              evidence: ['Found stereotype notation'],
            };
          },
        },
      ],
    };
  }

  /**
   * Entity Relationship diagram detection rule
   */
  private createEntityRelationshipRule(): DetectionRule {
    return {
      type: DiagramType.ENTITY_RELATIONSHIP,
      minimumConfidence: 65,
      patterns: [
        {
          name: 'entities',
          weight: 35,
          matcher: (shapes, metadata) => {
            const entities = shapes.filter(
              (s) =>
                !s.IsEdge &&
                (s.ShapeType.includes('rectangle') || s.ShapeType.includes('table')) &&
                !s.ShapeType.includes('rhombus')
            );
            return {
              matches: entities.length > 1,
              confidence: Math.min(100, entities.length * 20),
              evidence: [`Found ${entities.length} potential entities`],
            };
          },
        },
        {
          name: 'relationships',
          weight: 30,
          matcher: (shapes, metadata) => {
            const relationships = shapes.filter((s) => !s.IsEdge && s.ShapeType.includes('rhombus'));
            return {
              matches: relationships.length > 0,
              confidence: Math.min(100, relationships.length * 30),
              evidence: [`Found ${relationships.length} relationship diamonds`],
            };
          },
        },
        {
          name: 'attributes',
          weight: 25,
          matcher: (shapes, metadata) => {
            const attributes = shapes.filter((s) => !s.IsEdge && s.ShapeType.includes('ellipse'));
            return {
              matches: attributes.length > 0,
              confidence: Math.min(100, attributes.length * 15),
              evidence: [`Found ${attributes.length} attribute ellipses`],
            };
          },
        },
        {
          name: 'cardinality',
          weight: 10,
          matcher: (shapes, metadata) => {
            const hasCardinality = shapes.some(
              (s) => s.IsEdge && (s.Label.includes('1:1') || s.Label.includes('1:M') || s.Label.includes('M:N'))
            );
            return {
              matches: hasCardinality,
              confidence: 90,
              evidence: ['Found cardinality notation'],
            };
          },
        },
      ],
    };
  }

  /**
   * Network diagram detection rule
   */
  private createNetworkRule(): DetectionRule {
    return {
      type: DiagramType.NETWORK,
      minimumConfidence: 70,
      patterns: [
        {
          name: 'network-shapes',
          weight: 40,
          matcher: (shapes, metadata) => {
            const networkShapes = shapes.filter(
              (s) =>
                s.ShapeType.includes('cisco') ||
                s.ShapeType.includes('network') ||
                s.ShapeType.includes('router') ||
                s.ShapeType.includes('switch') ||
                s.ShapeType.includes('server') ||
                s.ShapeType.includes('firewall')
            );
            return {
              matches: networkShapes.length > 0,
              confidence: Math.min(100, networkShapes.length * 25),
              evidence: [`Found ${networkShapes.length} network device shapes`],
            };
          },
        },
        {
          name: 'ip-addresses',
          weight: 30,
          matcher: (shapes, metadata) => {
            const ipPattern = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/;
            const hasIPs = shapes.some((s) => ipPattern.test(s.Label));
            return {
              matches: hasIPs,
              confidence: 95,
              evidence: ['Found IP addresses in labels'],
            };
          },
        },
        {
          name: 'vlans',
          weight: 20,
          matcher: (shapes, metadata) => {
            const hasVLANs = shapes.some(
              (s) => s.Label.toLowerCase().includes('vlan') || s.Label.toLowerCase().includes('subnet')
            );
            return {
              matches: hasVLANs,
              confidence: 85,
              evidence: ['Found VLAN/subnet terminology'],
            };
          },
        },
        {
          name: 'network-terms',
          weight: 10,
          matcher: (shapes, metadata) => {
            const networkTerms = ['gateway', 'dns', 'dhcp', 'nat', 'vpn', 'wan', 'lan'];
            const hasNetworkTerms = shapes.some((s) =>
              networkTerms.some((term) => s.Label.toLowerCase().includes(term))
            );
            return {
              matches: hasNetworkTerms,
              confidence: 80,
              evidence: ['Found network-specific terminology'],
            };
          },
        },
      ],
    };
  }

  /**
   * Flowchart detection rule (most generic, keep last)
   */
  private createFlowchartRule(): DetectionRule {
    return {
      type: DiagramType.FLOWCHART,
      minimumConfidence: 40,
      patterns: [
        {
          name: 'decision-shapes',
          weight: 30,
          matcher: (shapes, metadata) => {
            const decisions = shapes.filter(
              (s) =>
                !s.IsEdge &&
                (s.ShapeType.includes('diamond') ||
                  s.ShapeType.includes('rhombus') ||
                  s.Label.includes('?') ||
                  s.Label.toLowerCase().includes('if') ||
                  s.Label.toLowerCase().includes('decision'))
            );
            return {
              matches: decisions.length > 0,
              confidence: Math.min(100, decisions.length * 25),
              evidence: [`Found ${decisions.length} decision points`],
            };
          },
        },
        {
          name: 'process-shapes',
          weight: 25,
          matcher: (shapes, metadata) => {
            const processes = shapes.filter(
              (s) => !s.IsEdge && (s.ShapeType.includes('rectangle') || s.ShapeType.includes('process'))
            );
            return {
              matches: processes.length > 2,
              confidence: Math.min(100, processes.length * 10),
              evidence: [`Found ${processes.length} process steps`],
            };
          },
        },
        {
          name: 'start-end-terminals',
          weight: 25,
          matcher: (shapes, metadata) => {
            const terminals = shapes.filter(
              (s) =>
                !s.IsEdge &&
                (s.ShapeType.includes('ellipse') ||
                  s.ShapeType.includes('terminator') ||
                  s.Label.toLowerCase().includes('start') ||
                  s.Label.toLowerCase().includes('end') ||
                  s.Label.toLowerCase().includes('begin'))
            );
            return {
              matches: terminals.length > 0,
              confidence: Math.min(100, terminals.length * 20),
              evidence: [`Found ${terminals.length} start/end terminals`],
            };
          },
        },
        {
          name: 'directional-flow',
          weight: 20,
          matcher: (shapes, metadata) => {
            return {
              matches: metadata.hasDirectionalFlow,
              confidence: 70,
              evidence: ['Found directional flow between elements'],
            };
          },
        },
      ],
    };
  }

  // Helper methods for metadata analysis
  private hasSpecializedShapes(shapeTypes: string[]): boolean {
    const specializedKeywords = ['uml', 'cisco', 'class', 'component', 'actor', 'lifeline'];
    return shapeTypes.some((type) => specializedKeywords.some((keyword) => type.toLowerCase().includes(keyword)));
  }

  private hasDirectionalFlow(edges: Shape[]): boolean {
    return edges.some((edge) => edge.Style.EndArrow > 0);
  }

  private hasHierarchy(shapes: Shape[]): boolean {
    // Check for parent-child relationships or containment
    const nodes = shapes.filter((s) => !s.IsEdge);
    const edges = shapes.filter((s) => s.IsEdge);

    // Simple heuristic: if there are significantly more nodes than edges, it might be hierarchical
    return nodes.length > 0 && edges.length / nodes.length < 0.5;
  }

  private hasTemporal(shapes: Shape[]): boolean {
    const temporalKeywords = ['time', 'sequence', 'order', 'step', 'phase', 'before', 'after'];
    return shapes.some((shape) => temporalKeywords.some((keyword) => shape.Label.toLowerCase().includes(keyword)));
  }

  private hasDataModel(shapeTypes: string[]): boolean {
    const dataKeywords = ['table', 'entity', 'attribute', 'relation', 'key', 'field'];
    return shapeTypes.some((type) => dataKeywords.some((keyword) => type.toLowerCase().includes(keyword)));
  }

  private hasNetworkElements(shapeTypes: string[]): boolean {
    const networkKeywords = ['router', 'switch', 'server', 'firewall', 'cisco', 'network'];
    return shapeTypes.some((type) => networkKeywords.some((keyword) => type.toLowerCase().includes(keyword)));
  }
}
