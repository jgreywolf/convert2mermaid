import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { deflateRawSync } from 'zlib';
import { parseData } from './parser/parser.js';
import { generateMermaidCode } from './scribe.js';

describe('Flowchart diagram generation', () => {
  it('sanitizes draw.io ids and formats edge labels for Mermaid flowcharts', async () => {
    const diagram = await parseData('tests/drawio.drawio');

    expect(diagram).toBeDefined();
    if (!diagram) {
      throw new Error('Failed to parse drawio fixture');
    }

    const mermaidCode = generateMermaidCode(diagram);

    expect(mermaidCode).toMatch(/^flowchart TD/);
    expect(mermaidCode).toContain('n0_5xJdOhSlpbQAjnFqhUo_4[" "]');
    expect(mermaidCode).toContain('n0F7vi46eRVVwoKnTOABEj_1["Rect1"]');
    expect(mermaidCode).toContain('n0F7vi46eRVVwoKnTOABEj_1 -->|connect1| n0F7vi46eRVVwoKnTOABEj_2');
    expect(mermaidCode).not.toContain('@{');
    expect(mermaidCode).not.toContain('F7vi46eRVVwoKnTOABEj-1');
    expect(mermaidCode).not.toContain('--"connect1"--');
    expect(mermaidCode).not.toContain('-- "connect1" --');
  });

  it('formats styled DrawIO edge labels without invalid Mermaid link syntax', async () => {
    const diagram = await parseData('tests/EdgesArrowsAndStyling.drawio');

    expect(diagram).toBeDefined();
    if (!diagram) {
      throw new Error('Failed to parse styled edges fixture');
    }

    const mermaidCode = generateMermaidCode(diagram);

    expect(mermaidCode).toContain('n02Qw8IFYnQMUSFGZe73MK_1 -->|Red thick edge| n02Qw8IFYnQMUSFGZe73MK_51');
    expect(mermaidCode).toContain('n02Qw8IFYnQMUSFGZe73MK_1 -->|x arrow head| n02Qw8IFYnQMUSFGZe73MK_52');
    expect(mermaidCode).toContain('n02Qw8IFYnQMUSFGZe73MK_50 -->|both direction arrows| n02Qw8IFYnQMUSFGZe73MK_54');
    expect(mermaidCode).toContain('n02Qw8IFYnQMUSFGZe73MK_50 -->|dashed line| n02Qw8IFYnQMUSFGZe73MK_52');
    expect(mermaidCode).not.toContain('-- "x arrow head" -->');
    expect(mermaidCode).not.toContain('-- "both direction arrows" -->');
    expect(mermaidCode).not.toContain('---|Red thick edge|');
    expect(mermaidCode).toContain('style n02Qw8IFYnQMUSFGZe73MK_1 stroke: #008040,color: #000000,fill: #f8cecc');
    expect(mermaidCode).not.toContain('light-dark(');
  });

  it('preserves visible text colors for filled DrawIO nodes', async () => {
    const mxGraphModel =
      '<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/><mxCell id="explicit" value="Explicit" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#CCCCCC;fontColor=#FFFFFF;" vertex="1" parent="1"/><mxCell id="default" value="Default" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#dae8fc;" vertex="1" parent="1"/></root></mxGraphModel>';
    const compressed = deflateRawSync(Buffer.from(encodeURIComponent(mxGraphModel), 'utf-8')).toString('base64');
    const testFile = path.join(os.tmpdir(), `convert2mermaid-text-color-${Date.now()}.drawio`);
    fs.writeFileSync(testFile, `<mxfile><diagram>${compressed}</diagram></mxfile>`);

    try {
      const diagram = await parseData(testFile);

      expect(diagram).toBeDefined();
      if (!diagram) {
        throw new Error('Failed to parse text color fixture');
      }

      const mermaidCode = generateMermaidCode(diagram);

      expect(mermaidCode).toContain('style n0explicit color: #FFFFFF,fill: #CCCCCC');
      expect(mermaidCode).toContain('style n0default color: #000000,fill: #dae8fc');
    } finally {
      fs.rmSync(testFile, { force: true });
    }
  });

  it('resolves DrawIO point-only edge endpoints and emits valid open links', async () => {
    const mxGraphModel =
      '<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/><mxCell id="source" value="Source" style="rounded=1;whiteSpace=wrap;html=1;" vertex="1" parent="1"><mxGeometry x="100" y="100" width="120" height="60" as="geometry"/></mxCell><mxCell id="target" value="Target" style="rounded=1;whiteSpace=wrap;html=1;" vertex="1" parent="1"><mxGeometry x="100" y="220" width="120" height="60" as="geometry"/></mxCell><mxCell id="next" value="Next" style="rounded=1;whiteSpace=wrap;html=1;" vertex="1" parent="1"><mxGeometry x="100" y="340" width="120" height="60" as="geometry"/></mxCell><mxCell id="labeled" value="go" style="edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;" edge="1" parent="1" source="source"><mxGeometry relative="1" as="geometry"><mxPoint x="160" y="220" as="targetPoint"/></mxGeometry></mxCell><mxCell id="open" style="edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;" edge="1" parent="1" source="target"><mxGeometry relative="1" as="geometry"><mxPoint x="160" y="340" as="targetPoint"/></mxGeometry></mxCell><mxCell id="dangling" value="skip" style="edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;" edge="1" parent="1" source="next"><mxGeometry relative="1" as="geometry"><mxPoint x="900" y="900" as="targetPoint"/></mxGeometry></mxCell></root></mxGraphModel>';
    const compressed = deflateRawSync(Buffer.from(encodeURIComponent(mxGraphModel), 'utf-8')).toString('base64');
    const testFile = path.join(os.tmpdir(), `convert2mermaid-point-edge-${Date.now()}.drawio`);
    fs.writeFileSync(testFile, `<mxfile><diagram>${compressed}</diagram></mxfile>`);

    try {
      const diagram = await parseData(testFile);

      expect(diagram).toBeDefined();
      if (!diagram) {
        throw new Error('Failed to parse point-only edge fixture');
      }

      const mermaidCode = generateMermaidCode(diagram);

      expect(mermaidCode).toContain('n0source -->|go| n0target');
      expect(mermaidCode).toContain('n0target --> n0next');
      expect(mermaidCode).not.toContain('skip');
      expect(mermaidCode).not.toContain(' n0\r\n');
      expect(mermaidCode).not.toContain('----');
      expect(mermaidCode).not.toMatch(/\s+n0(?:\r?\n|$)/);
    } finally {
      fs.rmSync(testFile, { force: true });
    }
  });

  it('resolves DrawIO point-only edge endpoints just outside node bounds', async () => {
    const mxGraphModel =
      '<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/><mxCell id="decision" value="Result" style="rhombus;whiteSpace=wrap;html=1;" vertex="1" parent="1"><mxGeometry x="100" y="100" width="120" height="80" as="geometry"/></mxCell><mxCell id="failure" value="Failure" style="ellipse;whiteSpace=wrap;html=1;" vertex="1" parent="1"><mxGeometry x="300" y="100" width="100" height="100" as="geometry"/></mxCell><mxCell id="edge" value="failed" style="edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;" edge="1" parent="1" source="decision"><mxGeometry relative="1" as="geometry"><mxPoint x="295" y="150" as="targetPoint"/></mxGeometry></mxCell></root></mxGraphModel>';
    const compressed = deflateRawSync(Buffer.from(encodeURIComponent(mxGraphModel), 'utf-8')).toString('base64');
    const testFile = path.join(os.tmpdir(), `convert2mermaid-near-edge-${Date.now()}.drawio`);
    fs.writeFileSync(testFile, `<mxfile><diagram>${compressed}</diagram></mxfile>`);

    try {
      const diagram = await parseData(testFile);

      expect(diagram).toBeDefined();
      if (!diagram) {
        throw new Error('Failed to parse near-boundary edge fixture');
      }

      const mermaidCode = generateMermaidCode(diagram);

      expect(mermaidCode).toContain('n0decision -->|failed| n0failure');
    } finally {
      fs.rmSync(testFile, { force: true });
    }
  });

  it('resolves DrawIO edges that target another edge back to the terminal node', async () => {
    const mxGraphModel =
      '<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/><mxCell id="start" value="Start" style="rounded=1;whiteSpace=wrap;html=1;" vertex="1" parent="1"><mxGeometry x="320" y="240" width="140" height="60" as="geometry"/></mxCell><mxCell id="decision" value="Check network" style="rhombus;whiteSpace=wrap;html=1;" vertex="1" parent="1"><mxGeometry x="310" y="430" width="160" height="80" as="geometry"/></mxCell><mxCell id="sleep" value="Sleep 1s" style="rounded=1;whiteSpace=wrap;html=1;" vertex="1" parent="1"><mxGeometry x="570" y="440" width="120" height="60" as="geometry"/></mxCell><mxCell id="toDecision" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;" edge="1" parent="1" source="start"><mxGeometry relative="1" as="geometry"><mxPoint x="390" y="430" as="targetPoint"/></mxGeometry></mxCell><mxCell id="backToFlow" value="retry" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;" edge="1" parent="1" source="sleep"><mxGeometry relative="1" as="geometry"><mxPoint x="390" y="380" as="targetPoint"/><Array as="points"><mxPoint x="630" y="380"/></Array></mxGeometry></mxCell></root></mxGraphModel>';
    const compressed = deflateRawSync(Buffer.from(encodeURIComponent(mxGraphModel), 'utf-8')).toString('base64');
    const testFile = path.join(os.tmpdir(), `convert2mermaid-edge-to-edge-${Date.now()}.drawio`);
    fs.writeFileSync(testFile, `<mxfile><diagram>${compressed}</diagram></mxfile>`);

    try {
      const diagram = await parseData(testFile);

      expect(diagram).toBeDefined();
      if (!diagram) {
        throw new Error('Failed to parse edge-to-edge fixture');
      }

      const mermaidCode = generateMermaidCode(diagram);

      expect(mermaidCode).toContain('n0start --> n0decision');
      expect(mermaidCode).toContain('n0sleep -->|retry| n0decision');
    } finally {
      fs.rmSync(testFile, { force: true });
    }
  });

  it('infers associations between unconnected DrawIO callouts and adjacent nodes', async () => {
    const mxGraphModel =
      '<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/><mxCell id="callout" value="Search types" style="shape=callout;whiteSpace=wrap;html=1;perimeter=calloutPerimeter;" vertex="1" parent="1"><mxGeometry x="100" y="100" width="220" height="80" as="geometry"/></mxCell><mxCell id="target" value="Call SearchFilename" style="rounded=1;whiteSpace=wrap;html=1;" vertex="1" parent="1"><mxGeometry x="100" y="180" width="220" height="80" as="geometry"/></mxCell><mxCell id="other" value="Other" style="rounded=1;whiteSpace=wrap;html=1;" vertex="1" parent="1"><mxGeometry x="500" y="180" width="220" height="80" as="geometry"/></mxCell></root></mxGraphModel>';
    const compressed = deflateRawSync(Buffer.from(encodeURIComponent(mxGraphModel), 'utf-8')).toString('base64');
    const testFile = path.join(os.tmpdir(), `convert2mermaid-callout-${Date.now()}.drawio`);
    fs.writeFileSync(testFile, `<mxfile><diagram>${compressed}</diagram></mxfile>`);

    try {
      const diagram = await parseData(testFile);

      expect(diagram).toBeDefined();
      if (!diagram) {
        throw new Error('Failed to parse callout association fixture');
      }

      const mermaidCode = generateMermaidCode(diagram);

      expect(mermaidCode).toContain('n0callout --- n0target');
      expect(mermaidCode).not.toContain('n0callout --- n0other');
    } finally {
      fs.rmSync(testFile, { force: true });
    }
  });

  it('uses DrawIO default arrows for edges without explicit arrow styles', async () => {
    const mxGraphModel =
      '<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/><mxCell id="source" value="Source" style="rounded=1;whiteSpace=wrap;html=1;" vertex="1" parent="1"><mxGeometry x="100" y="100" width="120" height="60" as="geometry"/></mxCell><mxCell id="target" value="Target" style="rounded=1;whiteSpace=wrap;html=1;" vertex="1" parent="1"><mxGeometry x="100" y="220" width="120" height="60" as="geometry"/></mxCell><mxCell id="plain" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;" edge="1" parent="1" source="source" target="target"><mxGeometry relative="1" as="geometry"/></mxCell></root></mxGraphModel>';
    const compressed = deflateRawSync(Buffer.from(encodeURIComponent(mxGraphModel), 'utf-8')).toString('base64');
    const testFile = path.join(os.tmpdir(), `convert2mermaid-default-arrow-${Date.now()}.drawio`);
    fs.writeFileSync(testFile, `<mxfile><diagram>${compressed}</diagram></mxfile>`);

    try {
      const diagram = await parseData(testFile);

      expect(diagram).toBeDefined();
      if (!diagram) {
        throw new Error('Failed to parse default arrow fixture');
      }

      const mermaidCode = generateMermaidCode(diagram);

      expect(mermaidCode).toContain('n0source --> n0target');
      expect(mermaidCode).not.toContain('n0source --- n0target');
    } finally {
      fs.rmSync(testFile, { force: true });
    }
  });

  it('preserves explicitly arrowless DrawIO edges', async () => {
    const mxGraphModel =
      '<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/><mxCell id="source" value="Source" style="rounded=1;whiteSpace=wrap;html=1;" vertex="1" parent="1"><mxGeometry x="100" y="100" width="120" height="60" as="geometry"/></mxCell><mxCell id="target" value="Target" style="rounded=1;whiteSpace=wrap;html=1;" vertex="1" parent="1"><mxGeometry x="100" y="220" width="120" height="60" as="geometry"/></mxCell><mxCell id="plain" style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;endArrow=none;" edge="1" parent="1" source="source" target="target"><mxGeometry relative="1" as="geometry"/></mxCell></root></mxGraphModel>';
    const compressed = deflateRawSync(Buffer.from(encodeURIComponent(mxGraphModel), 'utf-8')).toString('base64');
    const testFile = path.join(os.tmpdir(), `convert2mermaid-no-arrow-${Date.now()}.drawio`);
    fs.writeFileSync(testFile, `<mxfile><diagram>${compressed}</diagram></mxfile>`);

    try {
      const diagram = await parseData(testFile);

      expect(diagram).toBeDefined();
      if (!diagram) {
        throw new Error('Failed to parse explicit no-arrow fixture');
      }

      const mermaidCode = generateMermaidCode(diagram);

      expect(mermaidCode).toContain('n0source --- n0target');
      expect(mermaidCode).not.toContain('n0source --> n0target');
    } finally {
      fs.rmSync(testFile, { force: true });
    }
  });
});
