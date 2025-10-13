# Diagram Type Detection System

## Overview

The diagram type detection system analyzes input diagrams and automatically identifies their type with confidence scoring. This enables intelligent processing and conversion of diagrams based on their semantic content.

## Supported Diagram Types

-   **Sequence Diagrams**: UML sequence diagrams with actors, lifelines, and message flows
-   **Class Diagrams**: UML class diagrams with classes, attributes, methods, and relationships
-   **State Diagrams**: State machines with states, transitions, and triggers
-   **Component Diagrams**: Component architecture with components, interfaces, and dependencies
-   **Entity Relationship Diagrams**: Data models with entities, relationships, and attributes
-   **Network Diagrams**: Network topology with devices, connections, and protocols
-   **Flowcharts**: Process flows with decision points, processes, and flow control
-   **Gantt Charts**: Project timelines (PlantUML only)
-   **Mindmaps**: Hierarchical information structures (PlantUML only)

## Detection Features

### Multi-Format Support

-   **DrawIO**: XML structure analysis with shape pattern recognition
-   **PlantUML**: Text-based directive and keyword detection
-   **Visio**: Shape-based analysis through parsed diagram structures
-   **Excalidraw**: Shape-based analysis through parsed diagram structures

### Confidence Scoring

-   Each detection pattern has weighted importance
-   Multiple evidence types combine to create overall confidence
-   Minimum confidence thresholds prevent false positives
-   Competing pattern detection with best-match selection

### Pattern Evidence

-   Detailed evidence logging for debugging and transparency
-   Multiple detection patterns per diagram type
-   Fallback detection for ambiguous cases
-   Specialized vs. generic pattern prioritization

## Detection Patterns

### Sequence Diagrams

-   UML actor shapes (`shape=umlActor`)
-   Lifeline shapes (`targetShapes=umlLifeline`)
-   Message terminology (call, return, activate, deactivate)
-   Temporal ordering patterns
-   Message arrows and return patterns

### Class Diagrams

-   UML class shapes and swimlanes
-   HTML-formatted class content (DrawIO)
-   Attribute/method notation (+, -, #, |)
-   Data type patterns (int, string, boolean, etc.)
-   Association arrows and multiplicity

### State Diagrams

-   Start/end state shapes
-   Rounded rectangle states
-   Transition notation with triggers ([condition]/action)
-   State-related keywords (idle, active, waiting)

### Component Diagrams

-   Component shapes and modules
-   Interface ellipses
-   Dependency relationships (dashed lines)
-   Stereotype notation (<<component>>)

### Entity Relationship Diagrams

-   Entity rectangles
-   Relationship diamonds
-   Attribute ellipses
-   Cardinality notation (1:1, 1:M, M:N)

### Network Diagrams

-   Cisco shape namespaces
-   Network device keywords (router, switch, firewall)
-   IP address patterns
-   VLAN/subnet terminology

### Flowcharts

-   Decision diamonds
-   Process rectangles
-   Start/end terminals
-   Directional flow arrows

## Usage Examples

### Command Line Interface

```bash
# Automatic detection during conversion
node dist/index.js -i diagram.drawio -o output.mmd

# Output includes detection results:
# Detected diagram type: sequence (95% confidence)
# Detection evidence:
#   - sequence: Found UML actors, Found lifelines (95%)
#   - class: Found method notation (20%)
```

### Programmatic Usage

```typescript
import { DetectorFactory } from './detection/DetectorFactory.js';

// Analyze a file
const analysis = await DetectorFactory.analyzeFile('diagram.drawio');
console.log(`Type: ${analysis.detectedType}`);
console.log(`Confidence: ${analysis.confidence}%`);

// Analyze parsed shapes
const shapeAnalysis = DetectorFactory.analyzeShapes(shapes);
```

## Detection Results

### DiagramAnalysis Interface

```typescript
interface DiagramAnalysis {
    detectedType: DiagramType; // Primary detected type
    confidence: number; // 0-100 confidence score
    patterns: DetectionPattern[]; // All detected patterns with evidence
    metadata: DiagramMetadata; // Structural information
}
```

### Pattern Evidence

-   **Type**: The diagram type this pattern suggests
-   **Evidence**: Array of specific findings that support this type
-   **Weight**: Importance of this pattern in the overall detection
-   **Confidence**: How confident this specific pattern is

### Metadata

-   **Shape counts**: Total shapes and edges
-   **Shape types**: All shape types found in the diagram
-   **Structural flags**: Hierarchy, flow, temporal aspects, etc.

## Confidence Thresholds

-   **High Confidence (80-100%)**: Strong specialized patterns detected
-   **Medium Confidence (60-79%)**: Good evidence with some ambiguity
-   **Low Confidence (40-59%)**: Weak or conflicting evidence
-   **Unknown (<40%)**: Insufficient evidence for reliable detection

## Extension Points

### Adding New Diagram Types

1. Add type to `DiagramType` enum
2. Create detection patterns in appropriate detector
3. Add minimum confidence threshold
4. Create test cases with example diagrams

### Adding New Formats

1. Create format-specific detector extending `DiagramDetector`
2. Implement format-specific pattern analysis
3. Add to `DetectorFactory` switch statement
4. Create comprehensive test suite

### Improving Detection Accuracy

1. Analyze false positives/negatives in test results
2. Adjust pattern weights and confidence thresholds
3. Add new evidence patterns for better discrimination
4. Enhance format-specific parsing

## Testing

Comprehensive test suite covers:

-   All supported diagram types
-   Multiple file formats
-   Confidence scoring accuracy
-   Pattern evidence collection
-   Error handling for malformed files
-   Edge cases and ambiguous diagrams

Run tests: `npm test -- src/detection/DiagramDetector.spec.ts`
