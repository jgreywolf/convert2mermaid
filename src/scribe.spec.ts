import { describe, it, expect, test, beforeEach, beforeAll } from "vitest";
import { Scribe } from "./Scribe";
import { Parser } from "./Parser";
import { getMermaidShapeByValue } from "./shapes/flowchartShapes";

let parser: Parser;
let scribe: Scribe;

describe("given a selection of Visio shape data", () => {
  beforeAll(async (context) => {
    const vsdxFilePath = "src/Drawing.vsdx";
    parser = new Parser(vsdxFilePath);
    await parser.parse();
    scribe = new Scribe();
  });

  it("should correctly output mermaid syntax if no errors", async () => {
    scribe = new Scribe();
    const pages = parser.getPages();
    const shapes = pages[0].Shapes;
    const mermaidSyntax = scribe.writeMermaidCode(shapes);
    expect(mermaidSyntax).toContain(
      `flowchart TD
n01(decision
)
n01@{ shape: question }
n02(process
)
n02@{ shape: squareRect }
n03(undefined)
n03@{ shape: squareRect }`
    );
  });

  it("should translate process to squareRect", async () => {
    const pages = parser.getPages();
    const shapes = pages[0].Shapes;
    let index = 1;

    for (const shape of shapes) {
      const nodeShape = getMermaidShapeByValue(shape.Name);
      const node = scribe.translateShapeToNode(shape);
      expect(node).toBe(
        `n0${index}(${shape.Text})\r\nn0${index}@{ shape: ${nodeShape} }`
      );
      index++;
    }
  });

  it("should translate decision or diamond to question", async () => {
    scribe = new Scribe();
    const pages = parser.getPages();
    const shapes = pages[0].Shapes;
    const shape = shapes.find((shape) => shape.Name === "Decision");

    if (shape) {
      const node = scribe.translateShapeToNode(shape);
      expect(node).toBe(`n01(${shape.Text})\r\nn01@{ shape: question }`);
    }
  });
});
