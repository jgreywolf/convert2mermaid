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
  LineWeight: string;
  LineColor: string;
  LinePattern: string;
  Rounding: string;
  EndArrowSize: string;
  BeginArrow: string;
  EndArrow: string;
  LineCap: string;
  BeginArrowSize: string;
  FillForegnd: string;
  FillBkgnd: string;
  FillPattern: string;
}

export interface Master {
  ID: string;
  Name: string;
  NameU: string;
  IsCustomName: boolean;
  IsCustomNameU: boolean;
  UniqueID: string;
  BaseID: string;
  MasterType: string;
  RelID: string;
  Hidden: string;
}

export interface Page {
  ID: string;
  Name: string;
  RelationID: string;
  Shapes: Shape[];
  Connectors: Connector[];
}

export interface Shape {
  ID: string;
  MasterID: string;
  Type: string;
  TextColor: string;
  FillColor: string;
  LineWeight: number;
  LineColor: string;
  Text: string;
  ShapeType: string;
  IsHidden: boolean;
  Name: string;
}

export interface Connector extends Shape {
  FromNode: string;
  ToNode: string;
  ArrowStart: boolean;
  ArrowEnd: boolean;
}
