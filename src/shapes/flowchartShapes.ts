export enum MermaidShape {
  Rectangle = "rect",
  RoundedRect = "rounded",
  Process = "proc",
  MultiRect = "procs",
  TaggedRect = "tag-proc",
  DividedRectangle = "div-proc",
  Subprocess = "subproc",
  LinedProcess = "lin-proc",
  SlopedRect = "manual-input",
  NotchedRectangle = "notched-rectangle",

  DoubleCircle = "dblcirc",
  Circle = "circ",
  FilledCircle = "f-circ",
  FramedCircle = "fr-circ",
  SmallCircle = "sm-circ",

  Triangle = "tri",
  Extract = "extract",
  FlippedTriangle = "manual-file",

  Stadium = "stadium",
  Cylinder = "cyl",
  HorizontalCylinder = "h-cyl",
  Diamond = "dia",
  //Question = "question",
  Hexagon = "hex",
  LeanRight = "lean_r",
  LeanLeft = "lean_l",
  Trapezoid = "trap-t",
  Inv_trapezoid = "trap-b",

  TrapezoidalPentagon = "loop-limit",

  Rect_left_inv_arrow = "rect_left_inv_arrow",

  StateStart = "stateStart",
  StateEnd = "stateEnd",
  ForkJoin = "forkJoin",
  CurlyBraceLeft = "curlyBraceLeft",
  CurlyBraceRight = "curlyBraceRight",
  LightningBolt = "lightningBolt",
  WaveEdgedRectangle = "waveEdgedRectangle",
  LinedWaveEdgedRect = "linedWaveEdgedRect",
  MultiWaveEdgedRectangle = "multiWaveEdgedRectangle",
  TaggedWaveEdgedRectangle = "taggedWaveEdgedRectangle",
  HalfRoundedRectangle = "halfRoundedRectangle",
  TiltedCylinder = "tiltedCylinder",
  LinedCylinder = "linedCylinder",
  CurvedTrapezoid = "curvedTrapezoid",

  WindowPane = "windowPane",

  WaveRectangle = "waveRectangle",
  BowTieRect = "bowTieRect",
  CrossedCircle = "crossedCircle",
  Hourglass = "hourglass",
}

export const getMermaidShapeByValue = (shape: string): MermaidShape => {
  const value = shape.toLowerCase();

  switch (value) {
    case "rounded":
    case "event":
      return MermaidShape.RoundedRect;
    case "process":
      return MermaidShape.Process;
    case "rectangle":
      return MermaidShape.Rectangle;
    case "processes":
    case "stacked process":
      return MermaidShape.MultiRect;
    case "tagged-process":
      return MermaidShape.TaggedRect;
    case "pill":
    case "terminal":
      return MermaidShape.Stadium;
    case "subroutine":
    case "subprocess":
    case "framedRect":
      return MermaidShape.Subprocess;
    case "database":
    case "cylinder":
      return MermaidShape.Cylinder;
    case "diamond":
    case "decision":
    case "question":
      return MermaidShape.Diamond;
    case "prepare":
    case "hexagon":
      return MermaidShape.Hexagon;
    case "in-out":
    case "lean-right":
      return MermaidShape.LeanRight;
    case "out-in":
    case "lean-left":
      return MermaidShape.LeanLeft;
    case "priority":
    case "trapezoid":
      return MermaidShape.Trapezoid;
    case "manual":
    case "inv_trapezoid":
      return MermaidShape.Inv_trapezoid;
    case "doublecircle":
      return MermaidShape.DoubleCircle;
    case "circle":
      return MermaidShape.Circle;
    case "odd":
      return MermaidShape.Rect_left_inv_arrow;
    case "card":
      return MermaidShape.NotchedRectangle;
    case "lined-process":
    case "lined-rectangle":
      return MermaidShape.LinedProcess;
    case "small circle":
    case "start":
      return MermaidShape.StateStart;
    case "stop":
    case "framed-circle":
      return MermaidShape.StateEnd;
    case "forkJoin":
      return MermaidShape.ForkJoin;
    case "comment left":
      return MermaidShape.CurlyBraceLeft;
    case "comment right":
      return MermaidShape.CurlyBraceRight;
    case "bolt":
    case "com-link":
      return MermaidShape.LightningBolt;
    case "doc":
    case "document":
      return MermaidShape.WaveEdgedRectangle;
    case "lined-document":
      return MermaidShape.LinedWaveEdgedRect;
    case "documents":
    case "stacked-document":
      return MermaidShape.MultiWaveEdgedRectangle;
    case "tagged-document":
      return MermaidShape.TaggedWaveEdgedRectangle;
    case "delay":
      return MermaidShape.HalfRoundedRectangle;
    case "horizontal-cylinder":
    case "das":
    case "direct access storage":
      return MermaidShape.TiltedCylinder;
    case "disk storage":
    case "linedcylinder":
      return MermaidShape.LinedCylinder;
    case "display":
    case "curved-trapezoid":
      return MermaidShape.CurvedTrapezoid;
    case "divided-process":
    case "dividedrectangle":
      return MermaidShape.DividedRectangle;
    case "extract":
    case "triangle":
      return MermaidShape.Triangle;
    case "internalstorage":
    case "windowpane":
      return MermaidShape.WindowPane;
    case "junction":
    case "filledcircle":
      return MermaidShape.FilledCircle;
    case "loop-limit":
    case "trapezoidalpentagon":
      return MermaidShape.TrapezoidalPentagon;
    case "manual-file":
    case "flippedtriangle":
      return MermaidShape.FlippedTriangle;
    case "manual-input":
    case "slopedrect":
      return MermaidShape.SlopedRect;
    case "flag":
    case "paper-tape":
      return MermaidShape.WaveRectangle;
    case "stored-data":
    case "bowtie":
      return MermaidShape.BowTieRect;
    case "summary":
    case "crossedcircle":
      return MermaidShape.CrossedCircle;
    case "collate":
    case "hourglass":
      return MermaidShape.Hourglass;
  }

  return MermaidShape.Rectangle;
};
