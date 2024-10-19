/* eslint-disable @typescript-eslint/no-explicit-any */
import { Page } from '../types';
import { VisioParser } from './VisioParser.js';

export abstract class Parser {
  protected filepath: string;

  constructor(filePath: string) {
    this.filepath = filePath;
  }
  abstract parseDiagram(): Promise<Page[]>;
}

export class NullParser extends Parser {
  constructor(filePath: string) {
    super(filePath);
  }

  parseDiagram(): Promise<Page[]> {
    throw new Error('Null parser');
  }
}

export const getFileParser = (filePath: string) => {
  const extension = filePath.split('.').pop();
  switch (extension) {
    case 'vsdx': {
      return new VisioParser(filePath);
    }
    default: {
      return new NullParser(filePath);
    }
  }
};
