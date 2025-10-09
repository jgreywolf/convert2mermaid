# convert2mermaid

This is a command-line interface (CLI) to convert a diagram from one of the following types of files to [mermaid](https://mermaid.js.org/) syntax within a mmd file

-   Visio (vsdx)
-   DrawIO (drawio)
-   Excalidraw (excalidraw)

## Usage

-   `npm run build`
-   `node ./dist/index.js -i 'FilePath'`
-   Optional arguments are:
    -   -o OUTPUTFILENAME - output filename (defaults to input file name)
    -   -f OUTPUTFILEFORMAT - file format for output file (defaults to mmd)
    -   -d DIAGRAMTYPE - (only flowchart is accepted currently)

## Examples

### Visio Files

```bash
node ./dist/index.js -i tests/BasicShapes.vsdx
node ./dist/index.js -i tests/Connectors.vsdx -o output.mmd
```

### DrawIO Files

```bash
node ./dist/index.js -i tests/drawio.drawio
```

### Excalidraw Files

```bash
node ./dist/index.js -i tests/excalidraw.excalidraw
```

### PlantUML Files

```bash
node ./dist/index.js -i tests/sample-sequence.puml
node ./dist/index.js -i tests/sample-flowchart.puml
```

## Recently Completed

-   ✅ Updated to use vsdx-js v1.1.1 for better Visio support
-   ✅ Added support for DrawIO (.drawio) files
-   ✅ Added support for Excalidraw (.excalidraw) files
-   ✅ Added support for PlantUML (.puml, .plantuml) files

## ToDo:

-   Add support for other diagram types (class diagram, sequence, etc)
-   Add support for other file types (Lucidchart, others ...)
-   Enhanced styling support for all formats
-   Multi-page diagram support
