import AdmZip from 'adm-zip';
import { fail } from 'assert';
import * as fs from 'fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { parseStringPromise } from 'xml2js';
import { getParserFunctions } from './parser';
import { VisioMaster, VisioShape, VisioStyleSheet } from './types';

const testFilePath = 'tests/Connectors.vsdx';
let archive: AdmZip;
let parserFunctions: any = {};

describe('given a valid Visio file', () => {
  beforeAll(async () => {
    const vsdxBuffer = fs.readFileSync(testFilePath);
    parserFunctions = getParserFunctions(testFilePath);
    archive = new AdmZip(vsdxBuffer);
  });

  it('should return stylesheets from document properties', async () => {
    const documentXml = archive.getEntry('visio/document.xml');
    if (!documentXml) {
      fail('document.xml not found');
    }

    const xmlContent = documentXml.getData().toString('utf-8');
    const jsonObj = await parseStringPromise(xmlContent);
    const stylesheets = parserFunctions.parseDocumentProperties(jsonObj) as VisioStyleSheet[];
    expect(stylesheets.length).toBe(8);
  });

  it('should parse masters file', async () => {
    const mastersXml = archive.getEntry('visio/masters/masters.xml');
    if (!mastersXml) {
      fail('masters.xml not found');
    }

    const xmlContent = mastersXml.getData().toString('utf-8');
    const jsonObj = await parseStringPromise(xmlContent);
    const masters = parserFunctions.parseMastersFile(jsonObj) as VisioMaster[];
    expect(masters.length).toBe(34);
  });

  it('should parse shapes and connectors', async () => {
    const mastersXml = archive.getEntry('visio/masters/masters.xml');
    if (!mastersXml) {
      fail('masters.xml not found');
    }
    let xmlContent = mastersXml.getData().toString('utf-8');
    let jsonObj = await parseStringPromise(xmlContent);
    const masters = parserFunctions.parseMastersFile(jsonObj) as VisioMaster[];

    const pageXml = archive.getEntry('visio/pages/page1.xml');

    if (!pageXml) {
      fail('page1.xml not found');
    }

    xmlContent = pageXml.getData().toString('utf-8');
    jsonObj = await parseStringPromise(xmlContent);
    const pageObject = jsonObj['PageContents'];
    const shapes = parserFunctions.getShapes(pageObject, masters) as VisioShape[];
    expect(shapes.filter((shape) => !shape.IsEdge).length).toBe(2);
    expect(shapes.filter((shape) => shape.IsEdge).length).toBe(1);
  });
});
