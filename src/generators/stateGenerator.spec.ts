import { describe, expect, it } from 'vitest';
import { generateStateDiagram } from './stateGenerator.js';
import { Diagram, Shape, Style } from '../types.js';

const defaultStyle: Style = {
  FillForeground: '',
  FillBackground: '',
  TextColor: '',
  LineWeight: 1,
  LineColor: '',
  LinePattern: 0,
  Rounding: 0,
  BeginArrow: 0,
  BeginArrowSize: 0,
  EndArrow: 0,
  EndArrowSize: 0,
  LineCap: 0,
  FillPattern: 0,
};

const shape = (partial: Partial<Shape> & Pick<Shape, 'Id'>): Shape => ({
  Id: partial.Id,
  ShapeType: partial.ShapeType || 'rectangle',
  Label: partial.Label || '',
  Style: partial.Style || defaultStyle,
  IsEdge: partial.IsEdge || false,
  FromNode: partial.FromNode,
  ToNode: partial.ToNode,
});

describe('State diagram generation', () => {
  it('sanitizes draw.io ids before using them as Mermaid state ids', () => {
    const diagram: Diagram = {
      Shapes: [
        shape({ Id: 'F7vi46eRVVwoKnTOABEj-1', Label: 'Rect1' }),
        shape({ Id: 'F7vi46eRVVwoKnTOABEj-2', Label: 'Rect2' }),
        shape({
          Id: 'F7vi46eRVVwoKnTOABEj-3',
          IsEdge: true,
          FromNode: 'F7vi46eRVVwoKnTOABEj-1',
          ToNode: 'F7vi46eRVVwoKnTOABEj-2',
          Label: 'connect1',
        }),
      ],
    };

    const mermaidCode = generateStateDiagram(diagram);

    expect(mermaidCode).toContain('state "Rect1" as F7vi46eRVVwoKnTOABEj_1');
    expect(mermaidCode).toContain('F7vi46eRVVwoKnTOABEj_1 --> F7vi46eRVVwoKnTOABEj_2 : connect1');
    expect(mermaidCode).not.toContain('F7vi46eRVVwoKnTOABEj-1 -->');
  });
});
