export interface VisioDocument {
  Masters: Master[];
  Pages: Page[];
  Settings?: string;
}

export interface StyleSheet {
  ID: string;
  Name: string;
  LineStyleRefId: string;
  FillStyleRefId: string;
  TextStyleRefId: string;
  Style: Style;
}

export interface Master {
  ID: string;
  Name: string;
  UniqueID: string;
  BaseID: string;
  MasterType: string;
  RelationshipId: string;
  Hidden: string;
  LineStyleRefId: string;
  FillStyleRefId: string;
  TextStyleRefId: string;
}

export interface Page {
  ID: string;
  Name: string;
  Shapes: Shape[];
  Edges: Edge[];
  RelationshipId: string;
}

export interface Shape {
  ID: string;
  MasterID: string;
  Type: string;
  Text: string;
  Name: string;
  Style: Style;
}

export interface Edge extends Shape {
  FromNode: string;
  ToNode: string;
}

export interface Parser {
  parseDiagram(): Promise<Page[]>;
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
