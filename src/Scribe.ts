import * as fs from "fs";
import AdmZip from "adm-zip";
import { parseStringPromise } from "xml2js";
import { Master, Page, Shape } from "./types";
import { get } from "http";
import { getMermaidShapeByValue } from "./shapes/flowchartShapes";

interface NodeRecord {
  ID: string;
  Shape: Shape;
  NodeDef: string;
}

export class Scribe {
  nodes: NodeRecord[] = [];
  nextIndex: number = 0;

  constructor() {}

  translateShapeToNode = (shape: Shape) => {
    const nodeId = `n0${shape.ID}`;
    const nodeShape = getMermaidShapeByValue(shape.Name);
    const nodeDef = `${nodeId}(${shape.Text})\r\n${nodeId}@{ shape: ${nodeShape} }`;
    this.nodes.push({ ID: nodeId, Shape: shape, NodeDef: nodeDef });
    return nodeDef;
  };

  writeMermaidCode = (shapes: Shape[]) => {
    this.nodes = [];
    for (const shape of shapes) {
      this.translateShapeToNode(shape);
    }

    let mermaidSyntax = "flowchart TD\r\n";
    this.nodes.forEach((node) => {
      mermaidSyntax += node.NodeDef + "\r\n";
    });

    console.log(mermaidSyntax);
    return mermaidSyntax;
  };
}
