import { MermaidShape } from './flowchartShapes.js';

/**
 * Maps basic geometric shapes to MermaidShape enum
 */
export const mapBasicShapes = (value: string): MermaidShape | null => {
  switch (value) {
    case 'rounded':
    case 'rounded rectangle':
    case 'event':
      return MermaidShape.Rounded;
    case 'process':
    case 'rectangle':
      return MermaidShape.Rectangle;
    case 'diamond':
    case 'decision':
    case 'question':
    case 'diam': // Added for PlantUML support
      return MermaidShape.Diamond;
    case 'circle':
    case 'center drag circle':
    case 'circ': // Added for PlantUML support
      return MermaidShape.Circle;
    case 'triangle':
    case 'extract':
      return MermaidShape.Triangle;
    case 'hexagon':
    case 'prepare':
      return MermaidShape.Hexagon;
    case 'pill':
    case 'terminal':
    case 'start/end':
      return MermaidShape.Stadium;
    default:
      return null;
  }
};

/**
 * Maps document-related shapes to MermaidShape enum
 */
export const mapDocumentShapes = (value: string): MermaidShape | null => {
  switch (value) {
    case 'doc':
    case 'document':
      return MermaidShape.Document;
    case 'lined-document':
      return MermaidShape.LinedDocument;
    case 'documents':
    case 'stacked-document':
      return MermaidShape.MultiDocument;
    case 'tagged-document':
      return MermaidShape.TaggedDocument;
    default:
      return null;
  }
};

/**
 * Maps data storage shapes to MermaidShape enum
 */
export const mapStorageShapes = (value: string): MermaidShape | null => {
  switch (value) {
    case 'database':
    case 'cylinder':
    case 'can':
    case 'cyls': // Added for PlantUML support
      return MermaidShape.Database;
    case 'horizontal-cylinder':
    case 'das':
    case 'direct access storage':
      return MermaidShape.DirectAccessStorage;
    case 'disk storage':
    case 'linedcylinder':
      return MermaidShape.DiskStorage;
    case 'stored-data':
    case 'bowtie':
    case 'external data':
      return MermaidShape.StoredData;
    case 'internalstorage':
    case 'windowpane':
      return MermaidShape.InternalStorage;
    default:
      return null;
  }
};

/**
 * Maps process-related shapes to MermaidShape enum
 */
export const mapProcessShapes = (value: string): MermaidShape | null => {
  switch (value) {
    case 'card':
    case 'custom 2':
      return MermaidShape.NotchedRect;
    case 'lined-process':
    case 'lined-rectangle':
    case 'shaded-rectangle':
    case 'shaded-process':
      return MermaidShape.LinedShadedRect;
    case 'processes':
    case 'stacked process':
      return MermaidShape.MultiRect;
    case 'tagged-process':
      return MermaidShape.TaggedRect;
    case 'subroutine':
    case 'subprocess':
    case 'framedRect':
      return MermaidShape.FramedRect;
    case 'divided-process':
    case 'dividedrectangle':
      return MermaidShape.DividedRect;
    default:
      return null;
  }
};

/**
 * Maps input/output shapes to MermaidShape enum
 */
export const mapInputOutputShapes = (value: string): MermaidShape | null => {
  switch (value) {
    case 'in-out':
    case 'lean-right':
    case 'parallelogram':
    case 'data':
      return MermaidShape.DataInputOutput;
    case 'out-in':
    case 'lean-left':
      return MermaidShape.DataOutputInput;
    case 'manual-input':
    case 'slopedrect':
      return MermaidShape.ManualInput;
    case 'display':
    case 'curved-trapezoid':
      return MermaidShape.Display;
    default:
      return null;
  }
};

/**
 * Maps specialized shapes to MermaidShape enum
 */
export const mapSpecializedShapes = (value: string): MermaidShape | null => {
  switch (value) {
    case 'delay':
      return MermaidShape.Delay;
    case 'collate':
    case 'hourglass':
      return MermaidShape.Collate;
    case 'priority':
    case 'trapezoid':
      return MermaidShape.Trapezoid;
    case 'manual':
    case 'inv_trapezoid':
      return MermaidShape.FlippedTrapezoid;
    case 'loop-limit':
    case 'trapezoidalpentagon':
      return MermaidShape.LoopLimit;
    case 'flag':
    case 'paper-tape':
      return MermaidShape.PaperTape;
    case 'bolt':
    case 'com-link':
      return MermaidShape.LightningBolt;
    default:
      return null;
  }
};
