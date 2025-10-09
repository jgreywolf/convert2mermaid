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

export const getMermaidShapeByValue = (shape: string): MermaidShape => {
  const value = shape.toLowerCase();
  switch (value) {
    case 'rounded':
    case 'rounded rectangle':
    case 'event':
      return MermaidShape.Rounded;
    case 'process':
    case 'rectangle':
      return MermaidShape.Rectangle;
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
    case 'pill':
    case 'terminal':
    case 'start/end':
      return MermaidShape.Stadium;
    case 'extract':
    case 'triangle':
      return MermaidShape.Triangle;
    case 'manual-file':
    case 'rotated triangle':
      return MermaidShape.RotatedTriangle;
    case 'subroutine':
    case 'subprocess':
    case 'framedRect':
      return MermaidShape.FramedRect;
    case 'database':
    case 'cylinder':
    case 'can':
    case 'cyls': // Added for PlantUML support
      return MermaidShape.Database;
    case 'diamond':
    case 'decision':
    case 'question':
    case 'diam': // Added for PlantUML support
      return MermaidShape.Diamond;
    case 'prepare':
    case 'hexagon':
      return MermaidShape.Hexagon;
    case 'in-out':
    case 'lean-right':
    case 'parallelogram':
    case 'data':
      return MermaidShape.DataInputOutput;
    case 'out-in':
    case 'lean-left':
      return MermaidShape.DataOutputInput;
    case 'priority':
    case 'trapezoid':
      return MermaidShape.Trapezoid;
    case 'manual':
    case 'inv_trapezoid':
      return MermaidShape.FlippedTrapezoid;
    case 'doublecircle':
      return MermaidShape.DoubleCircle;
    case 'circle':
    case 'center drag circle':
    case 'circ': // Added for PlantUML support
      return MermaidShape.Circle;
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
    case 'bolt':
    case 'com-link':
      return MermaidShape.LightningBolt;
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
    case 'delay':
      return MermaidShape.Delay;
    case 'horizontal-cylinder':
    case 'das':
    case 'direct access storage':
      return MermaidShape.DirectAccessStorage;
    case 'disk storage':
    case 'linedcylinder':
      return MermaidShape.DiskStorage;
    case 'display':
    case 'curved-trapezoid':
      return MermaidShape.Display;
    case 'divided-process':
    case 'dividedrectangle':
      return MermaidShape.DividedRect;
    case 'internalstorage':
    case 'windowpane':
      return MermaidShape.InternalStorage;
    case 'junction':
    case 'filledcircle':
      return MermaidShape.FilledCircle;
    case 'loop-limit':
    case 'trapezoidalpentagon':
      return MermaidShape.LoopLimit;
    case 'manual-input':
    case 'slopedrect':
      return MermaidShape.ManualInput;
    case 'flag':
    case 'paper-tape':
      return MermaidShape.PaperTape;
    case 'stored-data':
    case 'bowtie':
    case 'external data':
      return MermaidShape.StoredData;
    case 'summary':
    case 'crossedcircle':
      return MermaidShape.CrossCircle;
    case 'collate':
    case 'hourglass':
      return MermaidShape.Collate;
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
