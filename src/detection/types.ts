/**
 * Diagram type detection types and interfaces
 */

export enum DiagramType {
  FLOWCHART = 'flowchart',
  SEQUENCE = 'sequence',
  CLASS = 'class',
  STATE = 'state',
  COMPONENT = 'component',
  ENTITY_RELATIONSHIP = 'entity-relationship',
  NETWORK = 'network',
  GANTT = 'gantt',
  MINDMAP = 'mindmap',
  TIMELINE = 'timeline',
  UNKNOWN = 'unknown',
}

export interface DiagramAnalysis {
  detectedType: DiagramType;
  confidence: number; // 0-100
  patterns: DetectionPattern[];
  metadata: DiagramMetadata;
}

export interface DetectionPattern {
  type: string;
  evidence: string[];
  weight: number;
  confidence: number;
}

export interface DiagramMetadata {
  totalShapes: number;
  totalEdges: number;
  shapeTypes: string[];
  hasSpecializedShapes: boolean;
  hasDirectionalFlow: boolean;
  hasHierarchy: boolean;
  hasTemporal: boolean;
  hasDataModel: boolean;
  hasNetworkElements: boolean;
}

export interface DetectionRule {
  type: DiagramType;
  patterns: PatternMatcher[];
  minimumConfidence: number;
}

export interface PatternMatcher {
  name: string;
  weight: number;
  matcher: (shapes: any[], metadata: DiagramMetadata) => DetectionResult;
}

export interface DetectionResult {
  matches: boolean;
  confidence: number;
  evidence: string[];
}
