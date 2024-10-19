import { Command } from 'commander';
import figlet from 'figlet';
import * as fs from 'fs';
import ora from 'ora';
import path from 'path';
import { getFileParser } from './parser/Parser.js';
import { writeMermaidCode } from './Scribe.js';

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
    let outputFilePath = options.outputFile || options.inputFile.replace(fileExt, '.mmd');

    const fileParser = getFileParser(filepath);
    const pages = await fileParser.parseDiagram();
    const pageCount = pages.length;
    let currentPageIndex = 1;

    const spinner = ora(`Processing ${pageCount} page${pageCount > 1 ? 's' : ''}`).start();

    for (const page of pages) {
      if (pageCount > 1) {
        outputFilePath = outputFilePath.replace('.mmd', `_${currentPageIndex}.mmd`);
      }
      console.log(`Working on ${page.Name}...`);
      const mermaidSyntax = writeMermaidCode(page);
      fs.writeFileSync(outputFilePath, mermaidSyntax);
      if (pageCount > 1) {
        currentPageIndex++;
      }
      spinner.succeed();
      console.log(`Mermaid syntax written to ${outputFilePath}`);
    }
    process.exit(0);
  } catch (error) {
    console.error('Error occurred while parsing source data!', error);
  }
}
