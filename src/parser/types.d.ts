import { Shape, Style } from '../types';

export interface DrawIOShape extends Shape {
  Parent: string;
  Vertex: string;
  Connectable: string;
}
