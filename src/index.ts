import { Command } from 'commander';
import figlet from 'figlet';
import * as fs from 'fs';
import ora from 'ora';
import path from 'path';
import { generateMermaidCode } from './scribe.js';
import { Diagram } from './types.js';
import { parseData } from './parser/parser.js';

const program = new Command();
const supportedFileTypes = ['.vsdx', '.drawio', '.excalidraw', '.puml', '.plantuml'];

console.log(figlet.textSync('convert2mermaid'));
program
  .name('convert2mermaid')
  .version('1.0.0')
  .description('A utility to convert diagrams in other formats to MermaidJs markdown syntax')
  .requiredOption('-i, --inputFile <value>', 'Input file')
  .option('-d, --diagramType [value]', 'Type of diagram', 'flowchart')
  .option('-o, --outputFile [value]', 'Output file name - defaults to input filename')
  .option('-f, --outputFormat [value]', 'Output format', 'mmd')

  .parse(process.argv);

const options = program.opts();
const fileExt = path.extname(options.inputFile);
if (!supportedFileTypes.includes(fileExt)) {
  console.error(`Unsupported file type: ${fileExt}. Supported file types are: ${supportedFileTypes}`);
  process.exit(1);
}

processFile(options.inputFile);

async function processFile(filepath: string) {
  const spinner = ora(`Processing ${filepath}`).start();
  let outputFilePath = options.outputFile || filepath.replace(fileExt, '.mmd');

  let diagram = await parseData(filepath);

  if (!diagram) {
    console.error(`No diagram detected in  ${filepath}, quitting.`);
    process.exit(0);
  }

  // Display detection results
  if (diagram.Analysis) {
    spinner.info(
      `Detected diagram type: ${diagram.Analysis.detectedType} (${diagram.Analysis.confidence}% confidence)`
    );

    if (diagram.Analysis.patterns.length > 0) {
      console.log('\nDetection evidence:');
      diagram.Analysis.patterns.forEach((pattern) => {
        console.log(`  - ${pattern.type}: ${pattern.evidence.join(', ')} (${pattern.confidence}%)`);
      });
    }

    if (diagram.Analysis.metadata.totalShapes > 0) {
      console.log(
        `\nDiagram metadata: ${diagram.Analysis.metadata.totalShapes} shapes, ${diagram.Analysis.metadata.totalEdges} edges`
      );
    }
    console.log(); // Empty line for spacing
  }

  try {
    const mermaidSyntax = generateMermaidCode(diagram);

    fs.writeFileSync(outputFilePath, mermaidSyntax);
    spinner.succeed();
    console.log(`Mermaid syntax written to ${outputFilePath}`);
  } catch (error) {
    console.error('Error occurred while parsing source data!', error);
  }

  process.exit(0);
}
