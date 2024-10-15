import { Command } from 'commander';
import figlet from 'figlet';
import * as fs from 'fs';
import { Parser } from './Parser.js';
import { Scribe } from './Scribe.js';

const program = new Command();

console.log(figlet.textSync('convert2mermaid'));

program
  .name('convert2mermaid')
  .version('1.0.0')
  .description(
    'A utility to convert diagrams in other formats to MermaidJs markdown syntax'
  )
  .requiredOption('-i, --inputFile <value>', 'Input file')
  .option(
    '-o, --outputFile [value]',
    'Output file name - defaults to input filename'
  )
  .option(
    '-f, --outputFormat [value]',
    'Output format - defaults to mmd',
    'mmd'
  )
  .option(
    '-d, --diagramType [value]',
    'Type of diagram - defaults to flowchart',
    'flowchart'
  )
  .parse(process.argv);

const options = program.opts();
const outputFile =
  options.outputFile || options.inputFile.replace('.vsdx', '.mmd');

parseData(options.inputFile);
async function parseData(filepath: string) {
  try {
    const fileParser = new Parser(filepath);
    const scribe = new Scribe();
    await fileParser.parse();
    const pages = fileParser.getAllPages();
    for (const page of pages) {
      const mermaidSyntax = scribe.writeMermaidCode(page);
      fs.writeFileSync(outputFile, mermaidSyntax);
    }
  } catch (error) {
    console.error('Error occurred while parsing source data!', error);
  }
}
