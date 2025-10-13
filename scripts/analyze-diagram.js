#!/usr/bin/env node

import { Command } from 'commander';
import { DetectorFactory } from '../dist/detection/DetectorFactory.js';
import { DiagramType } from '../dist/detection/types.js';
import * as path from 'path';
import * as fs from 'fs';

const program = new Command();

program
  .name('analyze-diagram')
  .version('1.0.0')
  .description('Analyze diagram type without conversion')
  .requiredOption('-i, --input <file>', 'Input diagram file')
  .option('-v, --verbose', 'Show detailed analysis')
  .parse(process.argv);

const options = program.opts();

async function analyzeDiagram() {
  try {
    if (!fs.existsSync(options.input)) {
      console.error(`File not found: ${options.input}`);
      process.exit(1);
    }

    console.log(`Analyzing: ${options.input}`);
    console.log('━'.repeat(50));

    const analysis = await DetectorFactory.analyzeFile(options.input);

    // Main result
    console.log(`📊 Detected Type: ${analysis.detectedType}`);
    console.log(`🎯 Confidence: ${analysis.confidence}%`);

    // Confidence indicator
    const indicator = getConfidenceIndicator(analysis.confidence);
    console.log(`📈 Reliability: ${indicator}`);

    if (options.verbose) {
      console.log('\n🔍 Detection Evidence:');
      console.log('━'.repeat(30));

      // Sort patterns by confidence
      const sortedPatterns = [...analysis.patterns].sort((a, b) => b.confidence - a.confidence);

      for (const pattern of sortedPatterns) {
        console.log(`\n${getDiagramTypeIcon(pattern.type)} ${pattern.type} (${pattern.confidence}%)`);
        for (const evidence of pattern.evidence) {
          console.log(`  • ${evidence}`);
        }
      }

      console.log('\n📋 Metadata:');
      console.log('━'.repeat(20));
      console.log(`Shapes: ${analysis.metadata.totalShapes}`);
      console.log(`Edges: ${analysis.metadata.totalEdges}`);
      console.log(`Shape Types: ${analysis.metadata.shapeTypes.length}`);

      const features = [];
      if (analysis.metadata.hasSpecializedShapes) features.push('Specialized Shapes');
      if (analysis.metadata.hasDirectionalFlow) features.push('Directional Flow');
      if (analysis.metadata.hasHierarchy) features.push('Hierarchy');
      if (analysis.metadata.hasTemporal) features.push('Temporal');
      if (analysis.metadata.hasDataModel) features.push('Data Model');
      if (analysis.metadata.hasNetworkElements) features.push('Network Elements');

      if (features.length > 0) {
        console.log(`Features: ${features.join(', ')}`);
      }
    }

    console.log('\n✨ Analysis complete!');
  } catch (error) {
    console.error('❌ Error analyzing diagram:', error);
    process.exit(1);
  }
}

function getConfidenceIndicator(confidence) {
  if (confidence >= 80) return '🟢 High (Very Reliable)';
  if (confidence >= 60) return '🟡 Medium (Good)';
  if (confidence >= 40) return '🟠 Low (Uncertain)';
  return '🔴 Very Low (Unknown)';
}

function getDiagramTypeIcon(type) {
  switch (type) {
    case DiagramType.SEQUENCE:
      return '🔄';
    case DiagramType.CLASS:
      return '📦';
    case DiagramType.STATE:
      return '🔀';
    case DiagramType.COMPONENT:
      return '🧩';
    case DiagramType.ENTITY_RELATIONSHIP:
      return '🗃️';
    case DiagramType.NETWORK:
      return '🌐';
    case DiagramType.FLOWCHART:
      return '📊';
    case DiagramType.GANTT:
      return '📅';
    case DiagramType.MINDMAP:
      return '🧠';
    default:
      return '❓';
  }
}

analyzeDiagram();
