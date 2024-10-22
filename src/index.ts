import { Command } from 'commander';
import figlet from 'figlet';
import * as fs from 'fs';
import ora from 'ora';
import path from 'path';
import { getParserFunctions } from './parser.js';
import { generateMermaidCode } from './scribe.js';

const program = new Command();
const supportedFileTypes = ['.vsdx'];

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

parseData(options.inputFile);

async function parseData(filepath: string) {
  try {
    const spinner = ora(`Processing ${options.inputFile}`).start();
    let outputFilePath = options.outputFile || options.inputFile.replace(fileExt, '.mmd');
    const parserFunctions = getParserFunctions(filepath);
    if (!parserFunctions) {
      console.log(`Failed to find parser for ${options.inputFile}`);
      process.exit(0);
    }

    const diagram = await parserFunctions?.parseDiagram(filepath);
    const mermaidSyntax = await generateMermaidCode(diagram);

    fs.writeFileSync(outputFilePath, mermaidSyntax);
    spinner.succeed();
    console.log(`Mermaid syntax written to ${outputFilePath}`);
  } catch (error) {
    console.error('Error occurred while parsing source data!', error);
  }

  process.exit(0);
}
