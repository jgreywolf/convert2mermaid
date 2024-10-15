/* eslint-disable @typescript-eslint/no-explicit-any */
import * as fs from 'fs';
import AdmZip from 'adm-zip';
import { parseStringPromise } from 'xml2js';
import { Connector, Master, Page, Shape, StyleSheet } from './types';

export class Parser {
  jsonObjects: any = {};
  styleSheets: StyleSheet[] = [];
  // filePath: string;
  archive: AdmZip;
  pages: Page[] = [];
  masters: Master[] = [];
  parsed: boolean = false;

  constructor(filePath: string) {
    //this.filePath = filePath;
    const vsdxBuffer = fs.readFileSync(filePath);
    this.archive = new AdmZip(vsdxBuffer);
  }

  parse = async () => {
    const entries = this.archive.getEntries();
    for (const entry of entries) {
      if (entry.entryName.endsWith('.xml')) {
        const xmlContent = entry.getData().toString('utf-8');

        const jsonObj = await parseStringPromise(xmlContent);

        const nameStartIndex = entry.entryName.lastIndexOf('/') + 1;
        const fileName = entry.entryName
          .substring(nameStartIndex)
          .replace('.xml', '');

        switch (fileName) {
          case 'masters':
            this.parseMastersFile(jsonObj);
            break;
          case 'pages':
            this.parsePagesFile(jsonObj);
            break;
          case 'document':
            this.parseDocumentProperties(jsonObj);
            break;
          default:
            this.jsonObjects[fileName] = jsonObj;
        }
      }
    }

    return this.getAllPages();
  };

  private getAllPages = () => {
    if (!this.parsed) {
      this.parse();
    }

    if (this.pages.length === 0) {
      throw new Error('No pages found - validate your source file');
    }

    const pageResults = [] as Page[];

    try {
      for (let i = 0; i < this.pages.length; i++) {
        const page = this.pages[i];
        let shapes = [] as Shape[];
        let connectors = [] as Connector[];

        const pageObj =
          this.jsonObjects[page.Name.toLowerCase()]['PageContents'];
        const shapeObjects = pageObj['Shapes'][0];

        if (shapeObjects) {
          shapes = this.getShapesFromPage(shapeObjects);
        }

        if (pageObj['Connects']) {
          const connectObjects = pageObj['Connects'][0]['Connect'];

          if (connectObjects) {
            const connectShapes = shapes.filter(
              (shape) => shape.Type === 'connector'
            );
            connectors = this.getConnectorsFromPage(
              connectObjects,
              connectShapes
            );
          }
        }

        page.Shapes = shapes;
        page.Connectors = connectors;
        pageResults.push(page);
      }
    } catch (e) {
      console.log(e);
    }

    return pageResults;
  };

  private parseDocumentProperties = (jsonObj: any) => {
    const stylesheets =
      jsonObj['VisioDocument']['StyleSheets'][0]['StyleSheet'];

    for (let i = 0; i < stylesheets.length; i++) {
      const sheet = {} as StyleSheet;

      sheet.ID = stylesheets[i]['$']['ID'];
      sheet.Name = stylesheets[i]['$']['Name'];
      sheet.LineStyleRefId = stylesheets[i]['$']['LineStyle'];
      sheet.FillStyleRefId = stylesheets[i]['$']['FillStyle'];
      sheet.TextStyleRefId = stylesheets[i]['$']['TextStyle'];

      const cells = stylesheets[i]['Cell'];

      sheet.LineWeight = this.getValueFromCell(cells, 'LineWeight');
      sheet.LineColor = this.getValueFromCell(cells, 'LineColor');
      sheet.LinePattern = this.getValueFromCell(cells, 'LinePattern');

      sheet.Rounding = this.getValueFromCell(cells, 'Rounding');
      sheet.EndArrowSize = this.getValueFromCell(cells, 'EndArrowSize');
      sheet.BeginArrow = this.getValueFromCell(cells, 'BeginArrow');
      sheet.EndArrow = this.getValueFromCell(cells, 'EndArrow');
      sheet.LineCap = this.getValueFromCell(cells, 'LineCap');
      sheet.BeginArrowSize = this.getValueFromCell(cells, 'BeginArrowSize');
      sheet.FillForegnd = this.getValueFromCell(cells, 'FillForegnd');
      sheet.FillBkgnd = this.getValueFromCell(cells, 'FillBkgnd');

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
      master.RelID = masters[i]['Rel'][0]['$']['r:id'];
      master.Hidden = masters[i]['$']['Hidden'];

      this.masters.push(master);
    }
  };

  private parsePagesFile = (jsonObj: any) => {
    const pagesTmp = jsonObj['Pages']['Page'];

    for (let i = 0; i < pagesTmp.length; i++) {
      const page = {} as Page;
      page.ID = pagesTmp[i]['$']['ID'];
      page.Name = pagesTmp[i]['$']['Name'].replace('-', '');
      page.RelationID = pagesTmp[i]['Rel'][0]['$']['r:id'];

      this.pages.push(page);
    }
  };

  private getConnectorsFromPage = (
    connectObjects: any,
    connectShapes: Shape[]
  ) => {
    const connectors = [] as Connector[];

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

      const connector = {} as Connector;
      connector.ID = connectShape.ID;
      connector.MasterID = connectShape.MasterID;
      connector.FillColor = connectShape.FillColor;
      connector.TextColor = connectShape.TextColor;
      connector.LineWeight = connectShape.LineWeight;
      connector.LineColor = connectShape.LineColor;
      connector.Text = connectShape.Text;
      connector.FromNode = fromNode.ToSheet;
      connector.ToNode = toNode.ToSheet;

      connectors.push(connector);
    }

    return connectors;
  };

  private getShapesFromPage = (shapeObjects: any) => {
    const shapeCount = shapeObjects['Shape'].length;
    const shapes = [] as Shape[];

    for (let i = 0; i < shapeCount; i++) {
      const shapeContainer = shapeObjects['Shape'][i];
      const shape = {} as Shape;
      shape.ID = shapeContainer['$']['ID'];
      shape.MasterID = shapeContainer['$']['Master'];
      shape.Type = shapeContainer['$']['Type'];

      const { name, shapeType, isHidden, masterRef } =
        this.getShapeDataFromMaster(shape.MasterID);

      shape.ShapeType = shapeType;
      shape.IsHidden = isHidden;
      shape.Name = name;
      shape.Type = shapeContainer['$']['Type'];

      if (shapeType === 'Dynamic connector') {
        shape.Type = 'connector';
      }

      shape.Text = `''`;
      if (shapeContainer['Text'] && shapeContainer['Text'][0]) {
        shape.Text = shapeContainer['Text'][0]['_'].replace(/\r?\n|\r/g, '');
      }

      if (shapeContainer['Section']) {
        shape.TextColor = this.getTextColor(shapeContainer['Section'][0]);
      }

      shapes.push(shape);
    }

    return shapes;
  };

  private getShapeDataFromMaster = (masterID: string) => {
    let name = 'null';
    let shapeType = 'unknown';
    let isHidden = true;
    let masterRef = '';

    const master = this.masters.find((master) => master.ID === masterID);

    if (master) {
      shapeType = master.Name;
      name = master.Name;
      isHidden = master.Hidden === '1' ? true : false;
      masterRef = master.RelID;
    }

    return { name, shapeType, isHidden, masterRef };
  };

  private getValueFromCell = (cells: any, field: string) => {
    let value = '';

    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      if (cell['$']['N'] === field) {
        value = cell['$']['V'];
      }
    }

    return value;
  };

  private getTextColor = (arg0: any): string => {
    let textColor = '000000';
    return textColor;
  };
}
