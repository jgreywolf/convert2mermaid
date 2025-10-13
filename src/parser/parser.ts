import { parseVisioFile, VisioFile, VisioShape } from 'vsdx-js';
import { Diagram, Shape, Style } from '../types.js';
import * as drawioParser from './drawioParser.js';
import * as excalidrawParser from './excalidrawParser.js';
import * as plantumlParser from './plantumlParser.js';
import { DetectorFactory } from '../detection/DetectorFactory.js';

// Convert VisioShape from vsdx-js to our internal Shape interface
const convertVisioShapeToShape = (visioShape: VisioShape): Shape => {
  return {
    Id: visioShape.Id,
    ShapeType: visioShape.Type,
    Label: visioShape.Label,
    Style: {
      FillForeground: visioShape.Style.FillForeground,
      FillBackground: visioShape.Style.FillBackground,
      TextColor: visioShape.Style.TextColor,
      LineWeight: visioShape.Style.LineWeight,
      LineColor: visioShape.Style.LineColor,
      LinePattern: visioShape.Style.LinePattern,
      Rounding: visioShape.Style.Rounding,
      BeginArrow: visioShape.Style.BeginArrow,
      BeginArrowSize: visioShape.Style.BeginArrowSize,
      EndArrow: visioShape.Style.EndArrow,
      EndArrowSize: visioShape.Style.EndArrowSize,
      LineCap: visioShape.Style.LineCap,
      FillPattern: visioShape.Style.FillPattern,
    },
    IsEdge: visioShape.IsEdge,
    FromNode: visioShape.FromNode,
    ToNode: visioShape.ToNode,
  };
};

export async function parseData(filepath: string): Promise<Diagram | undefined> {
  let diagram: Diagram | undefined = undefined;

  try {
    const extension = filepath.split('.').pop();
    switch (extension) {
      case 'vsdx': {
        const visioFile: VisioFile = await parseVisioFile(filepath);

        // Get shapes from the first page (assuming single page for now)
        if (visioFile.Pages && visioFile.Pages.length > 0) {
          const firstPage = visioFile.Pages[0];
          const convertedShapes = firstPage.Shapes.map(convertVisioShapeToShape);

          diagram = {
            Shapes: convertedShapes,
          };
        }
        break;
      }
      case 'drawio': {
        diagram = await drawioParser.parseDiagram(filepath);
        break;
      }
      case 'excalidraw': {
        diagram = await excalidrawParser.parseDiagram(filepath);
        break;
      }
      case 'puml':
      case 'plantuml': {
        diagram = await plantumlParser.parseDiagram(filepath);
        break;
      }
      default: {
        console.log(`Failed to find parser for ${filepath}`);
      }
    }

    // Add diagram type detection analysis
    if (diagram && diagram.Shapes.length > 0) {
      try {
        diagram.Analysis = await DetectorFactory.analyzeFile(filepath);
        console.log(
          `Detected diagram type: ${diagram.Analysis.detectedType} (confidence: ${diagram.Analysis.confidence}%)`
        );
      } catch (detectionError) {
        console.warn('Could not analyze diagram type:', detectionError);
        // Fall back to shape-based analysis
        diagram.Analysis = DetectorFactory.analyzeShapes(diagram.Shapes);
      }
    }
  } catch (error) {
    console.error(`Error parsing file: ${error}`);
  }

  return diagram;
}
