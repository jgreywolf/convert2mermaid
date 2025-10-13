import { Shape } from '../types.js';

export const determineClassRelationshipType = (rel: Shape): { type: string; reverse: boolean } => {
  // First check arrow styles for UML relationships
  const startArrow = rel.Style.BeginArrow;
  const endArrow = rel.Style.EndArrow;
  const startFill = rel.Style.BeginArrowSize; // In DrawIO, this indicates filled (1) or hollow (0)
  const endFill = rel.Style.EndArrowSize;
  const linePattern = rel.Style.LinePattern;

  // Check for interface implementation FIRST (hollow triangle with dashed line)
  // DrawIO: openthin arrow (4) or dashed line with block arrow
  // This must come before inheritance check since both use block arrows
  if (linePattern === 2) {
    if (endArrow === 4 || (endArrow === 2 && endFill === 0)) {
      return { type: '..|>', reverse: false }; // Implementation
    }
    if (startArrow === 4 || (startArrow === 2 && startFill === 0)) {
      return { type: '..|>', reverse: true }; // Implementation (reversed)
    }
  }

  // Check for inheritance (filled/hollow triangle arrow on solid line)
  // DrawIO: blockthin arrow (3) or block arrow (2) with hollow fill
  // If arrow is at start (BeginArrow), we need to reverse direction
  if (endArrow === 3 || (endArrow === 2 && endFill === 0 && linePattern !== 2)) {
    return { type: '--|>', reverse: false }; // Inheritance
  }
  if (startArrow === 3 || (startArrow === 2 && startFill === 0 && linePattern !== 2)) {
    return { type: '--|>', reverse: true }; // Inheritance (reversed)
  }

  // Check for composition (filled diamond)
  // DrawIO: diamond arrow (8) with fill (startFill=1)
  if (startArrow === 8 && startFill === 1) {
    return { type: '*--', reverse: false }; // Composition
  }
  if (endArrow === 8 && endFill === 1) {
    return { type: '--*', reverse: false }; // Composition (diamond at end)
  }

  // Check for aggregation (hollow diamond)
  // DrawIO: diamond arrow (8) without fill (startFill=0 or undefined)
  if (startArrow === 8 && startFill === 0) {
    return { type: 'o--', reverse: false }; // Aggregation
  }
  if (endArrow === 8 && endFill === 0) {
    return { type: '--o', reverse: false }; // Aggregation (diamond at end)
  }

  // Check for dependency (dashed line with arrow)
  if (linePattern === 2) {
    return { type: '..>', reverse: false }; // Dependency
  }

  // Fallback: check label for relationship type keywords
  const label = rel.Label?.toLowerCase() || '';

  if (label.includes('inherit') || label.includes('extends')) {
    return { type: '--|>', reverse: false };
  } else if (label.includes('implement') || label.includes('interface')) {
    return { type: '..|>', reverse: false };
  } else if (label.includes('composition')) {
    return { type: '*--', reverse: false };
  } else if (label.includes('aggregation')) {
    return { type: 'o--', reverse: false };
  } else if (label.includes('dependency') || label.includes('depends')) {
    return { type: '..>', reverse: false };
  }

  // Default association
  return { type: '-->', reverse: false }; // Association
};

export const parseCardinality = (label: string): string => {
  if (!label) return '||--||';

  const cardinality = label.toLowerCase();
  if (cardinality.includes('1:1') || cardinality.includes('one to one')) {
    return '||--||';
  } else if (cardinality.includes('1:m') || cardinality.includes('1:n') || cardinality.includes('one to many')) {
    return '||--o{';
  } else if (cardinality.includes('m:n') || cardinality.includes('many to many')) {
    return '}o--o{';
  } else {
    return '||--||';
  }
};

export const parseEntityAttributes = (label: string): string[] => {
  if (!label) return [];

  const lines = label
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const attributes: string[] = [];

  for (const line of lines) {
    if (line.includes(':') || line.includes(' ')) {
      const parts = line.split(/[:\s]+/);
      if (parts.length >= 2) {
        const attrName = parts[0];
        const attrType = parts[1] || 'string';
        attributes.push(`${attrType} ${attrName}`);
      }
    }
  }

  return attributes.length > 0 ? attributes : ['string name'];
};
