import { DiagramAnalysis } from './detection/types.js';

export interface Diagram {
  Shapes: Shape[];
  Settings?: string;
  Analysis?: DiagramAnalysis;
}

export interface Shape {
  Id: string;
  ShapeType: string;
  Label: string;
  Style: Style;
  IsEdge: boolean;
  FromNode?: string;
  ToNode?: string;
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
