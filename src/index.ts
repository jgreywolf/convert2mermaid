import { Command, Option, InvalidArgumentError } from 'commander';
import chalk from 'chalk';
import figlet from 'figlet';

const program = new Command();

console.log(figlet.textSync('convert2mermaid'));

program
  .version('1.0.0')
  .description(
    'A utility to convert diagrams in other formats to MermaidJs markdown syntax',
  )
  .option('-i, --inputFile  <value>', 'Input file')
  .option('-o, --outputFile [value]', 'Output file/format')
  .action((options) => {
    console.log(`Hello, ${options.name || 'World'}!`);
  })
  .parse(process.argv);

const options = program.opts();
