export interface Diagram {
  Shapes: Shape[];
  Settings?: string;
}

export interface Shape {
  Id: string;
  Type: string;
  Label: string;
  Style: Style;
  IsEdge: boolean;
  FromNode: string;
  ToNode: string;
}

export interface Style {
  FillForeground: string;
  FillBackground: string;
  TextColor: string;
  LineWeight: number;
  LineColor: string;
  LinePattern: number;
  Rounding: number;
  BeginArrow: number;
  BeginArrowSize: number;
  EndArrow: number;
  EndArrowSize: number;
  LineCap: number;
  FillPattern: number;
}
