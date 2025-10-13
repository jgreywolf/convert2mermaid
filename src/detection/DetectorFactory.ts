import { DiagramDetector } from './DiagramDetector.js';
import { DrawIODetector } from './DrawIODetector.js';
import { PlantUMLDetector } from './PlantUMLDetector.js';
import { DiagramType, DiagramAnalysis } from './types.js';
import { Shape } from '../types.js';
import * as path from 'path';

/**
 * Factory for creating appropriate diagram detectors based on file type
 */
export class DetectorFactory {
  /**
   * Creates the appropriate detector for the given file path
   */
  public static createDetector(filePath: string): DiagramDetector {
    const extension = path.extname(filePath).toLowerCase();

    switch (extension) {
      case '.drawio':
        return new DrawIODetector();
      case '.puml':
      case '.plantuml':
        return new PlantUMLDetector();
      case '.vsdx':
      case '.excalidraw':
      default:
        return new DiagramDetector();
    }
  }

  /**
   * Analyzes a diagram file and returns the detected type
   */
  public static async analyzeFile(filePath: string, buffer?: Buffer): Promise<DiagramAnalysis> {
    const extension = path.extname(filePath).toLowerCase();

    try {
      if (!buffer) {
        const fs = await import('fs');
        buffer = fs.readFileSync(filePath);
      }

      switch (extension) {
        case '.drawio':
          const drawioDetector = new DrawIODetector();
          return await drawioDetector.analyzeDrawIOFile(buffer);

        case '.puml':
        case '.plantuml':
          const plantumlDetector = new PlantUMLDetector();
          return plantumlDetector.analyzePlantUMLFile(buffer);

        case '.vsdx':
        case '.excalidraw':
        default:
          // For other formats, we'll need to parse to shapes first
          // This would integrate with the existing parsers
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
    } catch (error) {
      console.error(`Error analyzing file ${filePath}:`, error);
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
   * Analyzes shapes from any parser and returns the detected type
   */
  public static analyzeShapes(shapes: Shape[]): DiagramAnalysis {
    const detector = new DiagramDetector();
    return detector.analyze(shapes);
  }
}
