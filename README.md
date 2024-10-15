# convert2mermaid

This is a command-line interface (CLI) to convert a diagram from one of the following types of files to [mermaid](https://mermaid.js.org/) syntax within a mmd file

-   Visio (vsdx)

## Usage

-   run npm run build
-   node ./dist/index.js -i 'FilePath'
-   Optional arguments are:
    -   -o FILENAME - output filename (defaults to input file name)
    -   -f FORMAT - file format for output file (defaults to mmd)
    -   -d DIAGRAMTYPE - (only flowchart is accepted currently)
