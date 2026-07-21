import { Command } from 'commander';
import figlet from 'figlet';
import * as fs from 'fs';
import ora from 'ora';
import path from 'path';
import { convertToMermaid } from './api.js';

const program = new Command();
const supportedFileTypes = ['.vsdx', '.drawio', '.excalidraw', '.puml', '.plantuml'];

console.log(figlet.textSync('convert2mermaid'));
program
  .name('convert2mermaid')
  .version('1.0.0')
  .description('A utility to convert diagrams in other formats to MermaidJs markdown syntax')
  .option('-i, --inputFile [value]', 'Input file')
  .option('-d, --diagramType [value]', 'Type of diagram', 'flowchart')
  .option('-o, --outputFile [value]', 'Output file name - defaults to input filename')
  .option('-f, --outputFormat [value]', "Output format: 'mmd' or 'md'", 'mmd')
  .option('-dffc, --drawioFallbackFlowchartConfidence [value]', 'Fallback to flowchart when DrawIO detection confidence is below this percentage', '50')
  .addHelpText('after', `
Examples:
  # Run directly from TypeScript source (no build needed)
  npm start -- -i input.drawio -f md

  # Basic conversion (requires build first)
  node dist/cli.js -i input.drawio -o output.mmd

  # Specify output format
  node dist/cli.js -i diagram.vsdx -o result.md -f md`)
  .parse(process.argv);

const options = program.opts();

if (!options.inputFile) {
  program.help();
}

const fileExt = path.extname(options.inputFile);
if (!supportedFileTypes.includes(fileExt)) {
  console.error(`Unsupported file type: ${fileExt}. Supported file types are: ${supportedFileTypes}`);
  process.exit(1);
}

processFile(options.inputFile);

async function processFile(filepath: string) {
  const spinner = ora(`Processing ${filepath}`).start();
  const defaultExt = options.outputFormat === 'md' ? '.md' : '.mmd';
  const outputFilePath = options.outputFile || filepath.replace(fileExt, defaultExt);
  const drawioFallbackFlowchartConfidence = parseDrawioFallbackFlowchartConfidence();

  try {
    const result = await convertToMermaid(filepath, {
      drawioFallbackFlowchartConfidence,
      outputFormat: options.outputFormat,
      silent: false,
    });

    if (result.analysis) {
      spinner.info(
        `Detected diagram type: ${result.analysis.detectedType} (${result.analysis.confidence}% confidence)`
      );

      if (result.analysis.patterns.length > 0) {
        console.log('\nDetection evidence:');
        result.analysis.patterns.forEach((pattern) => {
          console.log(`  - ${pattern.type}: ${pattern.evidence.join(', ')} (${pattern.confidence}%)`);
        });
      }

      if (result.analysis.metadata.totalShapes > 0) {
        console.log(
          `\nDiagram metadata: ${result.analysis.metadata.totalShapes} shapes, ${result.analysis.metadata.totalEdges} edges`
        );
      }
      console.log();
    }

    fs.writeFileSync(outputFilePath, result.mermaid);
    spinner.succeed();
    console.log(`Mermaid syntax written to ${outputFilePath}`);
  } catch (error) {
    console.error('Error occurred while parsing source data!', error);
    process.exit(1);
  }

  process.exit(0);
}

function parseDrawioFallbackFlowchartConfidence(): number {
  const rawValue = options.drawioFallbackFlowchartConfidence;
  const parsed = Number(rawValue);

  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
    console.error(`Invalid fallback flowchart confidence: ${rawValue}. Expected a number from 0 to 100.`);
    process.exit(1);
  }

  return parsed;
}
