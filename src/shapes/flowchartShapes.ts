export enum MermaidShape {
  Rectangle = 'rect',
  Rounded = 'rounded',
  Stadium = 'stadium',
  FramedRect = 'fr-rect',
  MultiRect = 'st-rect',
  TaggedRect = 'tag-rect',
  LinedShadedRect = 'lin-rect',
  DividedRect = 'div-rect',
  NotchedRect = 'notch-rect',
  Database = 'cyl',
  DirectAccessStorage = 'h-cyl',
  DiskStorage = 'lin-cyl',
  DataInputOutput = 'lean-r',
  DataOutputInput = 'lean-l',
  Document = 'doc',
  LinedDocument = 'lin-doc',
  MultiDocument = 'docs',
  StoredData = 'bow-rect',
  TaggedDocument = 'tag-doc',
  Diamond = 'diam',
  Circle = 'circ',
  DoubleCircle = 'dbl-circ',
  SmallCircle = 'sm-circ',
  FramedCircle = 'fr-circ',
  CrossCircle = 'cross-circ',
  FilledCircle = 'f-circ',
  Odd = 'odd',
  Triangle = 'tri',
  RotatedTriangle = 'flip-tri',
  Hexagon = 'hex',
  Trapezoid = 'trap-b',
  FlippedTrapezoid = 'trap-t',
  LightningBolt = 'bolt',
  TextBlock = 'text',
  ForkJoin = 'fork',
  Collate = 'hourglass',
  Comment = 'brace',
  CommentRight = 'brace-r',
  Delay = 'delay',
  Display = 'curv-trap',
  InternalStorage = 'win-pane',
  LoopLimit = 'notch-pent',
  ManualInput = 'sl-rect',
  PaperTape = 'flag',
}

import { 
  mapBasicShapes, 
  mapDocumentShapes, 
  mapStorageShapes, 
  mapProcessShapes, 
  mapInputOutputShapes, 
  mapSpecializedShapes 
} from './shapeMappers.js';

export const getMermaidShapeByValue = (shape: string): MermaidShape => {
  const value = shape.toLowerCase();
  
  // Try each category of shapes
  const basicShape = mapBasicShapes(value);
  if (basicShape) return basicShape;
  
  const documentShape = mapDocumentShapes(value);
  if (documentShape) return documentShape;
  
  const storageShape = mapStorageShapes(value);
  if (storageShape) return storageShape;
  
  const processShape = mapProcessShapes(value);
  if (processShape) return processShape;
  
  const ioShape = mapInputOutputShapes(value);
  if (ioShape) return ioShape;
  
  const specializedShape = mapSpecializedShapes(value);
  if (specializedShape) return specializedShape;

  // Handle remaining special cases
  switch (value) {
    case 'manual-file':
    case 'rotated triangle':
      return MermaidShape.RotatedTriangle;
    case 'doublecircle':
      return MermaidShape.DoubleCircle;
    case 'odd':
      return MermaidShape.Odd;
    case 'small circle':
    case 'start':
    case 'on-page reference':
      return MermaidShape.SmallCircle;
    case 'stop':
    case 'framed-circle':
      return MermaidShape.FramedCircle;
    case 'forkjoin':
      return MermaidShape.ForkJoin;
    case 'comment left':
    case 'left brace':
      return MermaidShape.Comment;
    case 'comment right':
    case 'right brace':
      return MermaidShape.CommentRight;
    case 'junction':
    case 'filledcircle':
      return MermaidShape.FilledCircle;
    case 'summary':
    case 'crossedcircle':
      return MermaidShape.CrossCircle;
  }

  return MermaidShape.Rectangle;
};

export enum ArrowType {
  None = 'none',
  ArrowCross = 'arrow_cross',
  DoubleArrowCross = 'double_arrow_cross',
  ArrowPoint = 'arrow_point',
  DoubleArrowPoint = 'double_arrow_point',
  ArrowCircle = 'arrow_circle',
  DoubleArrowCircle = 'double_arrow_circle',
}
