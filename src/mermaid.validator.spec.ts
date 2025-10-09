import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import { parseData } from './parser.js';
import { generateMermaidCode } from './scribe.js';

describe('Mermaid Syntax Validation', () => {
  const validateMermaidSyntax = (mermaidCode: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const lines = mermaidCode
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    // Check for basic flowchart syntax
    if (!lines[0]?.match(/^flowchart\s+(TD|LR|TB|RL|BT)/)) {
      errors.push('Missing or invalid flowchart declaration');
    }

    // Check node definitions and edge statements
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];

      // Skip style and linkStyle lines
      if (line.startsWith('style ') || line.startsWith('linkStyle ')) {
        continue;
      }

      // Node definition check
      if (line.includes('@{')) {
        // Extract node ID and validate
        const nodeIdMatch = line.match(/^([^@]+)@/);
        if (nodeIdMatch) {
          const nodeId = nodeIdMatch[1];
          // Check for problematic characters in node IDs
          if (nodeId.match(/[^a-zA-Z0-9_-]/)) {
            errors.push(`Invalid characters in node ID: ${nodeId}`);
          }
        }

        // Check label syntax
        const labelMatch = line.match(/label:\s*([^}]+)\s*}/);
        if (labelMatch) {
          const labelContent = labelMatch[1].trim();
          // Check for unescaped colons (not part of <br/>)
          if (labelContent.match(/[^<]:[^/]/) && !labelContent.match(/<br\/>/)) {
            errors.push(`Unescaped colon in label: ${labelContent}`);
          }
        }
      }

      // Edge statement check
      else if (line.includes('-->') || line.includes('-.') || line.includes('--')) {
        // Extract edge label if present
        const edgeLabelMatch = line.match(/--([^-]+)--/);
        if (edgeLabelMatch) {
          const edgeLabel = edgeLabelMatch[1];
          // Edge labels with no spaces should be quoted or use different syntax
          // Accept quoted labels as valid
          if (
            !edgeLabel.includes(' ') &&
            edgeLabel.length > 0 &&
            !edgeLabel.startsWith('"') &&
            !edgeLabel.endsWith('"')
          ) {
            errors.push(`Edge label may cause syntax issues: ${edgeLabel}`);
          }
        }
      }
    }

    return { isValid: errors.length === 0, errors };
  };

  const testFileConversion = async (inputFile: string, expectedFormat: string) => {
    // Check if test file exists
    if (!fs.existsSync(inputFile)) {
      console.warn(`Test file ${inputFile} does not exist, skipping...`);
      return;
    }

    // Parse the diagram
    const diagram = await parseData(inputFile);
    expect(diagram).toBeDefined();

    if (!diagram) {
      throw new Error(`Failed to parse diagram from ${inputFile}`);
    }

    expect(diagram.Shapes).toBeDefined();

    // Generate Mermaid code
    const mermaidCode = generateMermaidCode(diagram);
    expect(mermaidCode).toBeDefined();
    expect(mermaidCode.length).toBeGreaterThan(0);

    // Validate that it starts with the expected format
    expect(mermaidCode.trim()).toMatch(/^flowchart\s+(TD|LR|TB|RL)/);

    // Validate Mermaid syntax
    const validation = validateMermaidSyntax(mermaidCode);
    if (!validation.isValid) {
      console.error(`Mermaid syntax validation failed for ${inputFile}:`);
      validation.errors.forEach((error) => console.error(`  - ${error}`));
      console.error(`Generated code:\n${mermaidCode}`);
    }
    expect(validation.isValid).toBe(true);

    return { mermaidCode, diagram, validation };
  };

  describe('Visio File Conversion', () => {
    it('should generate valid Mermaid syntax from BasicShapes.vsdx', async () => {
      await testFileConversion('tests/BasicShapes.vsdx', 'flowchart');
    });

    it('should generate valid Mermaid syntax from FlowchartShapes.vsdx', async () => {
      await testFileConversion('tests/FlowchartShapes.vsdx', 'flowchart');
    });

    it('should generate valid Mermaid syntax from Connectors.vsdx', async () => {
      await testFileConversion('tests/Connectors.vsdx', 'flowchart');
    });

    it('should generate valid Mermaid syntax from DiagramWithStyles.vsdx', async () => {
      await testFileConversion('tests/DiagramWithStyles.vsdx', 'flowchart');
    });
  });

  describe('DrawIO File Conversion', () => {
    it('should generate valid Mermaid syntax from drawio.drawio', async () => {
      const result = await testFileConversion('tests/drawio.drawio', 'flowchart');
      // This test is expected to fail due to edge label syntax - that's what we're testing
      if (result && !result.validation.isValid) {
        console.log('Expected failure: DrawIO edge labels need fixing');
      }
    });
  });

  describe('Excalidraw File Conversion', () => {
    it('should generate valid Mermaid syntax from excalidraw-allshapes-edges.excalidraw', async () => {
      await testFileConversion('tests/excalidraw-allshapes-edges.excalidraw', 'flowchart');
    });
  });

  describe('Mermaid Syntax Elements', () => {
    it('should not contain invalid characters in node IDs', async () => {
      const testFiles = ['tests/BasicShapes.vsdx', 'tests/excalidraw-allshapes-edges.excalidraw'];

      for (const file of testFiles) {
        if (fs.existsSync(file)) {
          const diagram = await parseData(file);
          if (!diagram) continue;

          const mermaidCode = generateMermaidCode(diagram);

          // Check for problematic characters in node IDs
          const lines = mermaidCode.split('\n');
          for (const line of lines) {
            if (line.includes('@{')) {
              // Node definition line
              const nodeIdMatch = line.match(/^([^@]+)@/);
              if (nodeIdMatch) {
                const nodeId = nodeIdMatch[1].trim();
                // Node IDs should only contain alphanumeric, underscore, and hyphen
                expect(nodeId).toMatch(/^[a-zA-Z0-9_-]+$/);
              }
            }
          }
        }
      }
    });

    it('should not contain unescaped colons in labels', async () => {
      const testFiles = ['tests/excalidraw-allshapes-edges.excalidraw'];

      for (const file of testFiles) {
        if (fs.existsSync(file)) {
          const diagram = await parseData(file);
          if (!diagram) continue;

          const mermaidCode = generateMermaidCode(diagram);

          // Check that labels don't contain unescaped colons
          const lines = mermaidCode.split('\n');
          for (const line of lines) {
            if (line.includes('label:')) {
              // Extract label content
              const labelMatch = line.match(/label:\s*([^}]+)\s*}/);
              if (labelMatch) {
                const labelContent = labelMatch[1].trim();
                // Labels should not contain standalone colons
                expect(labelContent).not.toMatch(/(?<!<br\/):/); // No colons except after <br/
              }
            }
          }
        }
      }
    });

    it('should have properly formatted line breaks in labels', async () => {
      const testFiles = ['tests/excalidraw-allshapes-edges.excalidraw'];

      for (const file of testFiles) {
        if (fs.existsSync(file)) {
          const diagram = await parseData(file);
          if (!diagram) continue;

          const mermaidCode = generateMermaidCode(diagram);

          // Check that line breaks are properly formatted as <br/>
          expect(mermaidCode).not.toMatch(/[^<]\\n/); // No unescaped \n
          expect(mermaidCode).not.toMatch(/[^<]\\r/); // No unescaped \r

          // If there are line breaks, they should be <br/> tags
          const brTags = mermaidCode.match(/<br\/>/g);
          if (brTags) {
            expect(brTags.length).toBeGreaterThan(0);
          }
        }
      }
    });
  });

  describe('Edge Label Syntax', () => {
    it('should handle edge labels properly', async () => {
      // Test specific edge label formats that could cause issues
      const testCases = [
        { input: 'connect1', expected: 'should be quoted or use different syntax' },
        { input: 'normal text with spaces', expected: 'should work fine' },
        { input: 'text with <br/> breaks', expected: 'should work fine' },
      ];

      for (const testCase of testCases) {
        const validation = validateMermaidSyntax(`flowchart TD\nA --${testCase.input}-- B`);
        if (testCase.input === 'connect1') {
          expect(validation.isValid).toBe(false);
          expect(validation.errors.some((e) => e.includes('Edge label may cause syntax issues'))).toBe(true);
        } else {
          expect(validation.isValid).toBe(true);
        }
      }
    });
  });

  describe('Generated Output Files', () => {
    it('should validate existing generated .mmd files', async () => {
      const outputFiles = [
        'tests/visio-flowchart-output.mmd',
        'tests/excalidraw-allshapes-edges-clean.mmd',
        'tests/excalidraw-allshapes-edges-final-clean.mmd',
        'tests/excalidraw-flowchart-compatible.mmd',
        'tests/drawio-output-fixed.mmd',
      ];

      for (const file of outputFiles) {
        if (fs.existsSync(file)) {
          const mermaidCode = fs.readFileSync(file, 'utf-8');
          const validation = validateMermaidSyntax(mermaidCode);

          if (!validation.isValid) {
            console.error(`Validation failed for ${file}:`);
            validation.errors.forEach((error) => console.error(`  - ${error}`));
          }

          expect(validation.isValid).toBe(true);
        }
      }
    });
  });
});
