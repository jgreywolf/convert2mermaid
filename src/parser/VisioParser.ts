/* eslint-disable @typescript-eslint/no-explicit-any */
import AdmZip from 'adm-zip';
import * as fs from 'fs';
import { parseStringPromise } from 'xml2js';
import { VisioMaster, VisioShape, VisioStyleSheet } from './types';
import { Diagram, Shape, Style } from '../types';
import { ParseDocumentStylesheets } from '../parser';

export const parseDiagram = async (filePath: string): Promise<any> => {
  const jsonObjects: any = {};
  const vsdxBuffer = fs.readFileSync(filePath);
  const archive = new AdmZip(vsdxBuffer);
  let masters: VisioMaster[] = [];
  let stylesheets: VisioStyleSheet[] = [];

  const entries = archive.getEntries();
  for (const entry of entries) {
    if (entry.entryName.endsWith('.xml')) {
      const fileName = getEntryName(entry.entryName);
      const xmlContent = entry.getData().toString('utf-8');
      const jsonObj = await parseStringPromise(xmlContent);

      switch (fileName) {
        case 'document':
          stylesheets = parseDocumentProperties(jsonObj);
          break;
        case 'masters':
          masters = parseMastersFile(jsonObj);
          break;
        default:
          if (fileName.startsWith('page') || fileName.startsWith('master')) {
            jsonObjects[fileName] = jsonObj;
          }
      }
    }
  }
  const pageObject = jsonObjects['page1']['PageContents'];
  const shapes = getShapes(pageObject, masters);
  return { Shapes: shapes } as Diagram;
};

export const parseDocumentProperties: ParseDocumentStylesheets = (jsonObj: any) => {
  const styleSheets: VisioStyleSheet[] = [];
  const stylesheetObjects = jsonObj['VisioDocument']['StyleSheets'][0]['StyleSheet'];

  for (let i = 0; i < stylesheetObjects.length; i++) {
    const sheet = {} as VisioStyleSheet;

    sheet.ID = stylesheetObjects[i]['$']['ID'];
    sheet.Name = stylesheetObjects[i]['$']['Name'];
    sheet.LineStyleRefId = stylesheetObjects[i]['$']['LineStyle'];
    sheet.FillStyleRefId = stylesheetObjects[i]['$']['FillStyle'];
    sheet.TextStyleRefId = stylesheetObjects[i]['$']['TextStyle'];
    sheet.Style = stylesheetObjects[i]['Cell'];

    styleSheets.push(sheet);
  }

  return styleSheets;
};

export const parseMastersFile = (jsonObj: any) => {
  const masters: VisioMaster[] = [];
  const masterObjects = jsonObj['Masters']['Master'];

  for (let i = 0; i < masterObjects.length; i++) {
    const master = {} as VisioMaster;
    master.ID = masterObjects[i]['$']['ID'];
    master.Name = masterObjects[i]['$']['Name'];
    master.UniqueID = masterObjects[i]['$']['UniqueID'];
    master.MasterType = masterObjects[i]['$']['MasterType'];
    master.RelationshipId = masterObjects[i]['Rel'][0]['$']['r:id'];
    master.Hidden = masterObjects[i]['$']['Hidden'];
    master.LineStyleRefId = masterObjects[i]['PageSheet']['LineStyle'];
    master.FillStyleRefId = masterObjects[i]['PageSheet']['FillStyle'];
    master.TextStyleRefId = masterObjects[i]['PageSheet']['TextStyle'];

    masters.push(master);
  }

  return masters;
};

export const getShapes = (pageObject: any, masters: VisioMaster[]): Shape[] => {
  let shapes = [] as VisioShape[];
  const shapeObjects = pageObject['Shapes'][0];
  const connectObjects = pageObject['Connects'];

  try {
    const shapeCount = shapeObjects['Shape'].length;
    for (let i = 0; i < shapeCount; i++) {
      const shape = { Type: 'unknown', IsEdge: false, Label: '' } as VisioShape;
      const shapeContainer = shapeObjects['Shape'][i];
      const cells = shapeContainer['Cell'];

      shape.Id = shapeContainer['$']['ID'];
      shape.MasterId = shapeContainer['$']['Master'];
      const master = masters.find((master) => master.ID === shape.MasterId);

      if (master) {
        shape.Type = master.Name;

        if (shape.Type === 'Dynamic connector' && connectObjects) {
          const { fromNode, toNode } = getConnectorNodes(connectObjects[0]['Connect'], shape.Id);
          shape.FromNode = fromNode;
          shape.ToNode = toNode;
          shape.IsEdge = true;
        }
      }

      if (shapeContainer['Text'] && shapeContainer['Text'][0]) {
        shape.Label = shapeContainer['Text'][0]['_'].replace(/\r?\n|\r/g, '').trim();
      }

      shape.Style = getStyleFromObject(cells);

      shapes.push(shape);
    }
  } catch (e) {
    console.log(e);
  }

  return shapes;
};

export const getConnectorNodes = (connectObjects: any, shapeId: string) => {
  let fromNode = '';
  let toNode = '';

  try {
    const connects = connectObjects.filter(
      // @ts-ignore
      (connect) => connect['$'].FromSheet === shapeId
    );

    // @ts-ignore
    const from = connects.find((c) => c['$'].FromCell === 'BeginX')['$'];
    // @ts-ignore
    const to = connects.find((c) => c['$'].FromCell === 'EndX')['$'];

    fromNode = from.ToSheet;
    toNode = to.ToSheet;
  } catch (e) {
    console.log(e);
  }

  return { fromNode, toNode };
};

export const getStyleFromObject = (cells: any[]): Style => {
  const style = {} as Style;
  const lineWeightInPixels = parseFloat(getValueFromCell(cells, 'LineWeight')) * 96;
  style.LineWeight = lineWeightInPixels;
  style.LineColor = getValueFromCell(cells, 'LineColor');
  style.LinePattern = parseFloat(getValueFromCell(cells, 'LinePattern'));
  style.Rounding = parseFloat(getValueFromCell(cells, 'Rounding'));
  style.BeginArrow = parseFloat(getValueFromCell(cells, 'BeginArrow'));
  style.BeginArrowSize = parseFloat(getValueFromCell(cells, 'BeginArrowSize'));
  style.EndArrow = parseFloat(getValueFromCell(cells, 'EndArrow'));
  style.EndArrowSize = parseFloat(getValueFromCell(cells, 'EndArrowSize'));
  style.LineCap = parseFloat(getValueFromCell(cells, 'LineCap'));
  style.FillForeground = getValueFromCell(cells, 'FillForegnd');
  style.FillBackground = getValueFromCell(cells, 'FillBkgnd');
  style.TextColor = getValueFromCell(cells, 'Color');
  style.FillPattern = parseFloat(getValueFromCell(cells, 'FillPattern'));

  return style;
};

const getValueFromCell = (cells: any, field: string): string => {
  let value = '';

  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i];
    if (cell['$']['N'] === field) {
      value = cell['$']['V'];
    }
  }
  return value;
};

const getEntryName = (entryName: string) => {
  const nameStartIndex = entryName.lastIndexOf('/') + 1;
  return entryName.substring(nameStartIndex).replace('.xml', '');
};
