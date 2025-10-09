import { Diagram, Shape } from '../types.js';
import { createDefaultStyle } from '../utils/styleUtils.js';
import { createParseError, safeFileRead } from '../utils/errorUtils.js';

/**
 * Abstract base class for all parsers to reduce code duplication
 * and enforce consistent error handling and structure
 */
export abstract class BaseParser {
  protected filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  /**
   * Main parse method that handles common error cases
   */
  public async parseDiagram(): Promise<Diagram> {
    try {
      const buffer = safeFileRead(this.filePath);
      const shapes = await this.parseContent(buffer);
      return { Shapes: shapes };
    } catch (error) {
      console.error(`Error parsing ${this.getParserName()} file:`, error);
      return { Shapes: [] };
    }
  }

  /**
   * Abstract method that each parser must implement
   */
  protected abstract parseContent(buffer: Buffer): Promise<Shape[]>;

  /**
   * Returns the name of the parser for logging purposes
   */
  protected abstract getParserName(): string;

  /**
   * Creates a basic shape with default values
   */
  protected createBaseShape(id: string, shapeType: string, label: string = ''): Shape {
    return {
      Id: id,
      ShapeType: shapeType,
      Label: this.sanitizeLabel(label),
      Style: createDefaultStyle(),
      IsEdge: false,
      FromNode: '',
      ToNode: '',
    };
  }

  /**
   * Creates an edge shape
   */
  protected createEdgeShape(id: string, fromNode: string, toNode: string, label: string = ''): Shape {
    const shape = this.createBaseShape(id, 'line', label);
    shape.IsEdge = true;
    shape.FromNode = fromNode;
    shape.ToNode = toNode;
    return shape;
  }

  /**
   * Sanitizes labels by removing HTML entities and tags
   */
  protected sanitizeLabel(label: string): string {
    if (!label) return '';

    return label
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .trim();
  }

  /**
   * Generates a safe node ID from a string
   */
  protected generateNodeId(originalId: string): string {
    // Convert to safe Mermaid node ID format
    return originalId.replace(/[^a-zA-Z0-9]/g, '_').replace(/^[0-9]/, 'n$&'); // Ensure it doesn't start with a number
  }

  /**
   * Validates that the parsed file has the expected structure
   */
  protected validateFileStructure(data: unknown, requiredProps: string[]): void {
    if (!data || typeof data !== 'object') {
      throw createParseError('Invalid file structure: expected object', this.filePath, this.getParserName());
    }

    const obj = data as Record<string, unknown>;
    for (const prop of requiredProps) {
      if (!(prop in obj)) {
        throw createParseError(`Missing required property: ${prop}`, this.filePath, this.getParserName());
      }
    }
  }
}
