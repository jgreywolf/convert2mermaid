import { beforeAll, describe, expect, it } from 'vitest';
import { getParserFunctions } from './parser/parser';
import { writeMermaidCode } from './scribe';
import { Diagram } from './types';

describe('given a selection of Visio shape data', () => {
  it('should translate flowchart shapes', async () => {
    const parserFunctions = getParserFunctions('.vsdx');
    const diagram = await parserFunctions?.parseDiagram('tests/BasicShapes.vsdx');

    const mermaidSyntax = writeMermaidCode(diagram);
    expect(mermaidSyntax).toContain(`flowchart TD
n012@{ shape: rect, label:  }
n013@{ shape: rect, label:  }
n014@{ shape: circ, label:  }
n016@{ shape: tri, label:  }
n017@{ shape: hex, label:  }
n018@{ shape: cyl, label:  }
n020@{ shape: lean-r, label:  }
n021@{ shape: trap-b, label:  }
n022@{ shape: diam, label:  }
n023@{ shape: rounded, label:  }
n024@{ shape: circ, label:  }
n025@{ shape: brace, label:  }
n026@{ shape: brace-r, label:  }`);
  });

  it('should write edges', async () => {
    const parserFunctions = getParserFunctions('.vsdx');
    const diagram = await parserFunctions?.parseDiagram('tests/Connectors.vsdx');
    const mermaidSyntax = writeMermaidCode(diagram);
    expect(mermaidSyntax).toContain(`flowchart TD
n040@{ shape: rect, label:  }
n041@{ shape: rect, label:  }
n040 --> n041`);
  });

  it('should write style statements', async () => {
    const parserFunctions = getParserFunctions('.vsdx');
    const diagram = await parserFunctions?.parseDiagram('tests/DiagramWithStyles.vsdx');
    const mermaidSyntax = writeMermaidCode(diagram);
    expect(mermaidSyntax).toContain(`flowchart TD
n01@{ shape: rect, label: Rect 1 }
n02@{ shape: rect, label: Rect 2 }
n02 --connect 1--> n01
style n01 fill: #7f7f7f,stroke: #c05046
linkStyle 0 stroke: #c05046`);
  });
});
