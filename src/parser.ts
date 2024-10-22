import { Diagram } from './types';
import { VisioStyleSheet } from './parser/types';
import * as visioParser from './parser/visioParser.js';

export type ParseDiagramFunction = (filePath: string) => Diagram;
export type ParseDocumentStylesheets = (jsonObj: any) => VisioStyleSheet[];

export const getParserFunctions = (filePath: string) => {
  const extension = filePath.split('.').pop();
  switch (extension) {
    case 'vsdx': {
      return visioParser;
    }
    default: {
      return;
    }
  }
};
