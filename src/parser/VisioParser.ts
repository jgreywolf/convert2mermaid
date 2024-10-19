/* eslint-disable @typescript-eslint/no-explicit-any */
import AdmZip from 'adm-zip';
import * as fs from 'fs';
import { parseStringPromise } from 'xml2js';
import { Edge, Master, Page, Parser, Shape, Style, StyleSheet } from '../types';

export class VisioParser implements Parser {
  filepath: string;
  jsonObjects: any = {};
  archive: AdmZip;
  pages: Page[] = [];
  masters: Master[] = [];
  styleSheets: StyleSheet[] = [];

  constructor(filePath: string) {
    this.filepath = filePath;
    const vsdxBuffer = fs.readFileSync(filePath);
    this.archive = new AdmZip(vsdxBuffer);
  }

  parseDiagram = async (): Promise<Page[]> => {
    const entries = this.archive.getEntries();
    for (const entry of entries) {
      if (entry.entryName.endsWith('.xml')) {
        const fileName = this.getEntryName(entry.entryName);
        const xmlContent = entry.getData().toString('utf-8');
        const jsonObj = await parseStringPromise(xmlContent);

        switch (fileName) {
          case 'document':
            this.parseDocumentProperties(jsonObj);
            break;
          case 'masters':
            this.parseMastersFile(jsonObj);
            break;
          case 'pages':
            this.parsePagesFile(jsonObj);
            break;
          default:
            if (fileName.startsWith('page') || fileName.startsWith('master')) {
              this.jsonObjects[fileName] = jsonObj;
            }
        }
      }
    }

    return this.getAllPages();
  };

  private parseDocumentProperties = (jsonObj: any) => {
    const stylesheets = jsonObj['VisioDocument']['StyleSheets'][0]['StyleSheet'];

    for (let i = 0; i < stylesheets.length; i++) {
      const sheet = {} as StyleSheet;

      sheet.ID = stylesheets[i]['$']['ID'];
      sheet.Name = stylesheets[i]['$']['Name'];
      sheet.LineStyleRefId = stylesheets[i]['$']['LineStyle'];
      sheet.FillStyleRefId = stylesheets[i]['$']['FillStyle'];
      sheet.TextStyleRefId = stylesheets[i]['$']['TextStyle'];
      sheet.Style = stylesheets[i]['Cell'];

      this.styleSheets.push(sheet);
    }
  };

  private parseMastersFile = (jsonObj: any) => {
    const masters = jsonObj['Masters']['Master'];

    for (let i = 0; i < masters.length; i++) {
      const master = {} as Master;
      master.ID = masters[i]['$']['ID'];
      master.Name = masters[i]['$']['Name'];
      master.UniqueID = masters[i]['$']['UniqueID'];
      master.MasterType = masters[i]['$']['MasterType'];
      master.RelationshipId = masters[i]['Rel'][0]['$']['r:id'];
      master.Hidden = masters[i]['$']['Hidden'];
      master.LineStyleRefId = masters[i]['PageSheet']['LineStyle'];
      master.FillStyleRefId = masters[i]['PageSheet']['FillStyle'];
      master.TextStyleRefId = masters[i]['PageSheet']['TextStyle'];

      // masters[i]['PageSheet']['Cell'];

      this.masters.push(master);
    }
  };

  private parsePagesFile = (jsonObj: any) => {
    const pagesTmp = jsonObj['Pages']['Page'];

    for (let i = 0; i < pagesTmp.length; i++) {
      const page = {} as Page;
      page.ID = pagesTmp[i]['$']['ID'];
      page.Name = pagesTmp[i]['$']['Name'].replace('-', '');
      page.RelationshipId = pagesTmp[i]['Rel'][0]['$']['r:id'];

      this.pages.push(page);
    }
  };

  private getAllPages = (): Page[] => {
    if (this.pages.length === 0) {
      throw new Error('No pages found - validate your source file');
    }

    const pageResults = [] as Page[];

    try {
      for (let i = 0; i < this.pages.length; i++) {
        const page = this.pages[i];
        let shapes = [] as Shape[];
        let connectors = [] as Edge[];

        const pageObj = this.jsonObjects[page.Name.toLowerCase()]['PageContents'];
        const shapeObjects = pageObj['Shapes'][0];

        if (shapeObjects) {
          shapes = this.getShapesFromPage(shapeObjects);
        }

        if (pageObj['Connects']) {
          const connectObjects = pageObj['Connects'][0]['Connect'];

          if (connectObjects) {
            const connectShapes = shapes.filter((shape) => shape.Type === 'connector');
            connectors = this.getConnectorsFromPage(connectObjects, connectShapes);
          }
        }

        page.Shapes = shapes;
        page.Edges = connectors;
        pageResults.push(page);
      }
    } catch (e) {
      console.log(e);
    }

    return pageResults;
  };

  private getConnectorsFromPage = (connectObjects: any, connectShapes: Shape[]) => {
    const connectors = [] as Edge[];

    for (let i = 0; i < connectShapes.length; i++) {
      const connectShape = connectShapes[i];

      const connects = connectObjects.filter(
        // @ts-ignore
        (connect) => connect['$'].FromSheet === connectShape.ID
      );

      // @ts-ignore
      const fromNode = connects.find((c) => c['$'].FromCell === 'BeginX')['$'];
      // @ts-ignore
      const toNode = connects.find((c) => c['$'].FromCell === 'EndX')['$'];

      const connector = {} as Edge;
      connector.ID = connectShape.ID;
      connector.MasterID = connectShape.MasterID;
      connector.Style = connectShape.Style;
      connector.Text = connectShape.Text;
      connector.FromNode = fromNode.ToSheet;
      connector.ToNode = toNode.ToSheet;

      connectors.push(connector);
    }

    return connectors;
  };

  private getShapesFromPage = (shapeObjects: any) => {
    const shapes = [] as Shape[];
    const shapeCount = shapeObjects['Shape'].length;

    for (let i = 0; i < shapeCount; i++) {
      const shape = {} as Shape;
      const shapeContainer = shapeObjects['Shape'][i];
      const cells = shapeContainer['Cell'];

      shape.ID = shapeContainer['$']['ID'];
      shape.MasterID = shapeContainer['$']['Master'];

      const { name, shapeType, isHidden } = this.getShapeDataFromMaster(shape.MasterID);

      shape.Type = shapeType;
      shape.Name = name;

      if (shapeType === 'Dynamic connector') {
        shape.Type = 'connector';
      }

      shape.Text = ``;
      if (shapeContainer['Text'] && shapeContainer['Text'][0]) {
        shape.Text = shapeContainer['Text'][0]['_'].replace(/\r?\n|\r/g, '').trim();
      }

      shape.Style = this.getStyleFromObject(cells);

      shapes.push(shape);
    }

    return shapes;
  };

  private getShapeDataFromMaster = (shapeMasterID: string) => {
    let name = 'null';
    let shapeType = 'unknown';
    let isHidden = true;

    const master = this.masters.find((master) => master.ID === shapeMasterID);
    if (master) {
      shapeType = master.Name;
      name = master.Name;
      isHidden = master.Hidden === '1' ? true : false;
    }

    return { name, shapeType, isHidden };
  };

  private getStyleFromObject = (cells: any[]): Style => {
    const style = {} as Style;
    const lineWeightInPixels = parseFloat(this.getValueFromCell(cells, 'LineWeight')) * 96;
    style.LineWeight = lineWeightInPixels;
    style.LineColor = this.getValueFromCell(cells, 'LineColor');
    style.LinePattern = parseFloat(this.getValueFromCell(cells, 'LinePattern'));
    style.Rounding = parseFloat(this.getValueFromCell(cells, 'Rounding'));
    style.BeginArrow = parseFloat(this.getValueFromCell(cells, 'BeginArrow'));
    style.BeginArrowSize = parseFloat(this.getValueFromCell(cells, 'BeginArrowSize'));
    style.EndArrow = parseFloat(this.getValueFromCell(cells, 'EndArrow'));
    style.EndArrowSize = parseFloat(this.getValueFromCell(cells, 'EndArrowSize'));
    style.LineCap = parseFloat(this.getValueFromCell(cells, 'LineCap'));
    style.FillForeground = this.getValueFromCell(cells, 'FillForegnd');
    style.FillBackground = this.getValueFromCell(cells, 'FillBkgnd');
    style.TextColor = this.getValueFromCell(cells, 'Color');
    style.FillPattern = parseFloat(this.getValueFromCell(cells, 'FillPattern'));

    return style;
  };

  private getValueFromCell = (cells: any, field: string): string => {
    let value = '';

    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      if (cell['$']['N'] === field) {
        value = cell['$']['V'];
      }
    }
    return value;
  };

  private getEntryName = (entryName: string) => {
    const nameStartIndex = entryName.lastIndexOf('/') + 1;
    return entryName.substring(nameStartIndex).replace('.xml', '');
  };
}
