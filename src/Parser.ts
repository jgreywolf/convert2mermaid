import * as fs from 'fs';
import AdmZip from 'adm-zip';
import { parseStringPromise } from 'xml2js';
import { Master, Page, Shape } from './types';

export class Parser {
  jsonObjects: any = {};
  filePath: string;
  archive: AdmZip;
  pages: Page[] = [];
  masters: Master[] = [];

  constructor(filePath: string) {
    this.filePath = filePath;
    const vsdxBuffer = fs.readFileSync(this.filePath);
    this.archive = new AdmZip(vsdxBuffer);
  }

  parse = async() => {
    const entries = this.archive.getEntries();    

    for (const entry of entries) {
      if (entry.entryName.endsWith('.xml')) {
        const xmlContent = entry.getData().toString('utf-8');
        
        const jsonObj = await parseStringPromise(xmlContent);
        const nameStartIndex = entry.entryName.lastIndexOf('/') + 1;
        const fileName = entry.entryName.substring(nameStartIndex).replace('.xml', '');
        if(fileName === 'masters') {
          this.parseMasters(jsonObj);
        }
        if(fileName === 'pages') {
          this.parsePages(jsonObj);
        }

        this.jsonObjects[fileName] = jsonObj;
      }
    }
  }

  getPages = () => {
    if(this.pages.length === 0) {
      throw new Error('No pages found - make sure you run parse() first');
    }

    const pageResults = [] as Page[];

    try {
      
    for(let i = 0; i < this.pages.length; i++) {
      const page = this.pages[i];

      const pageObj = this.jsonObjects[page.Name.toLowerCase()]['PageContents'];
      let shapeObjects = pageObj['Shapes'][0];
      const shapes = this.getShapesFromPage(shapeObjects);
      page.Shapes = shapes;
      pageResults.push(page);
    }
  } catch (e) {
    console.log(e);
  }

    return pageResults;
  }

  private parseMasters = (jsonObj: any) => {
    const masters = jsonObj['Masters']['Master'];

    for(let i = 0; i < masters.length; i++) {
      let master = {} as Master;
      master.ID = masters[i]['$']['ID'];
      master.Name = masters[i]['$']['Name'];
      master.NameU = masters[i]['$']['NameU'];
      master.IsCustomName = masters[i]['$']['IsCustomName'];
      master.IsCustomNameU = masters[i]['$']['IsCustomNameU'];
      master.UniqueID = masters[i]['$']['UniqueID'];
      master.BaseID = masters[i]['$']['BaseID'];
      master.MasterType = masters[i]['$']['MasterType'];
      master.RelID = masters[i]['$']['RelID'];
      master.Hidden = masters[i]['$']['Hidden'];

      this.masters.push(master);
    }
  }

  private parsePages = (jsonObj: any) => {
    const pagesTmp = jsonObj['Pages']['Page'];

    for(let i = 0; i < pagesTmp.length; i++) {
      let page = {} as Page;
      page.ID = pagesTmp[i]['$']['ID'];
      page.Name = pagesTmp[i]['$']['Name'].replace('-','');
      page.RelationID = pagesTmp[i]['Rel'][0]['$']['r:id'];

      this.pages.push(page);
    }
  }

  private getShapesFromPage = (shapeObjects: any) => {
    const shapeCount = shapeObjects['Shape'].length;
    const shapes = [] as Shape[];

    for(let i = 0; i < shapeCount; i++) {
      let shapeContainer = shapeObjects['Shape'][i];
      const shape = {} as Shape;
      shape.ID = shapeContainer['$']['ID'];
      shape.MasterID = shapeContainer['$']['Master'];
      shape.Type = shapeContainer['$']['Type'];
      if(shapeContainer['Text'] && shapeContainer['Text'][0]) {
        shape.Text = shapeContainer['Text'][0]['_'];
      }
      
      shape.TextColor = this.getTextColor(shapeContainer['Section'][0]);

      const {FillColor, LineWeight, LineColor} = this.getShapeData(shapeContainer['Cell']);

      shape.FillColor = FillColor;
      shape.LineWeight = LineWeight;
      shape.LineColor = LineColor;

      const {Name, ShapeType, IsHidden} = this.getShapeDataFromMaster(shape.MasterID)

      shape.ShapeType = ShapeType;
      shape.IsHidden = IsHidden;
      shape.Name = Name;

      shapes.push(shape);
    }

    return shapes;
  }

  private getShapeDataFromMaster = (masterID: string) => {
    let Name = 'null';
    let ShapeType = 'unknown';
    let IsHidden = true;

    let master = this.masters.find(master => master.ID === masterID);

    if(master) {
      ShapeType = master.Name;
      Name = master.NameU;
      IsHidden = master.Hidden === '1' ? true : false;
    }
    
    return {Name, ShapeType, IsHidden};
  } 

  private getShapeData = (arg0: any): { FillColor: any; LineWeight: any; LineColor: any; } => {
    let FillColor = 'ffffff';
    let LineWeight = 0;
    let LineColor = '000000';
    
    for(let i=0; i < arg0.length; i++) {
      const cell = arg0[i];
      if(cell['$']['N'] === 'LineWeight') {
        LineWeight = cell['$']['V'];
      } else if(cell['$']['N'] === 'LineColor') {
        LineColor = cell['$']['V'];
      } else if(cell['$']['N'] === 'FillBkgnd') {
        FillColor = cell['$']['V'];
      }
    }

    return {FillColor, LineWeight, LineColor};
  }
    
  private getTextColor = (arg0: any): string => {
    let textColor = '000000';
    return textColor;  
  }
}
