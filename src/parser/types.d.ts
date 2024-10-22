import { Shape, Style } from '../types';

export interface VisioFile {
  Masters: VisioMaster[];
  Shapes: VisioShape[];
  StyleSheets: VisioStyleSheet[];
  Settings?: string;
}

export interface VisioStyleSheet {
  ID: string;
  Name: string;
  LineStyleRefId: string;
  FillStyleRefId: string;
  TextStyleRefId: string;
  Style: Style;
}

export interface VisioMaster {
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

export interface VisioPage {
  ID: string;
  Name: string;
  Shapes: VisioShape[];
  RelationshipId: string;
}

export interface VisioShape extends Shape {
  MasterId: string;
}
