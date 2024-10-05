export interface VisioDocument {
  Masters: Master[];
  Pages: Page[];
  Settings?: string;
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
}

export interface Shape {
  ID: string;
  MasterID: string;
  Type: string;
  TextColor: string;
  FillColor: string;
  LineWeight: string;
  LineColor: string;  
  Text: string;
  ShapeType: string;
  IsHidden: boolean;
  Name: string;
}
