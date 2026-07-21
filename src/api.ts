import { Diagram } from './types.js';
import { DetectionOptions, DiagramAnalysis } from './detection/types.js';
import { parseData } from './parser/parser.js';
import { generateMermaidCode } from './scribe.js';

export type MermaidOutputFormat = 'mmd' | 'md';

export interface ConvertToMermaidOptions extends DetectionOptions {
  outputFormat?: MermaidOutputFormat;
}

export interface ConvertToMermaidResult {
  diagram: Diagram;
  mermaid: string;
  analysis?: DiagramAnalysis;
}

export async function parseDiagram(filepath: string, options: DetectionOptions = {}): Promise<Diagram | undefined> {
  return parseData(filepath, { silent: true, ...options });
}

export async function convertToMermaid(
  filepath: string,
  options: ConvertToMermaidOptions = {}
): Promise<ConvertToMermaidResult> {
  const diagram = await parseDiagram(filepath, options);

  if (!diagram) {
    throw new Error(`No diagram detected in ${filepath}`);
  }

  const mermaidSyntax = generateMermaidCode(diagram);
  const mermaid =
    options.outputFormat === 'md' ? '```mermaid\n' + mermaidSyntax + '\n```\n' : mermaidSyntax;

  return {
    diagram,
    mermaid,
    analysis: diagram.Analysis,
  };
}

export { generateMermaidCode, parseData };
export type { Diagram, DiagramAnalysis, DetectionOptions };
