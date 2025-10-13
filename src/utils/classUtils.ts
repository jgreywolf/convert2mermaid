import { Shape } from '../types.js';

export const extractStereotype = (label: string): string => {
  if (!label) return '';

  // Decode HTML entities FIRST, before removing tags
  let content = label.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

  // Look for <<stereotype>> notation BEFORE removing HTML tags
  const stereotypeMatch = content.match(/<<([^>]+)>>/);
  if (stereotypeMatch) {
    return stereotypeMatch[1].trim();
  }

  return '';
};

export const extractClassName = (label: string, sanitizeClassName: (name: string) => string): string => {
  if (!label) return '';

  // Look for class name in <b> tags first
  const boldMatch = label.match(/<b>([^<]+)<\/b>/);
  if (boldMatch) {
    return sanitizeClassName(boldMatch[1]);
  }

  // Decode HTML entities
  let content = label.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  content = content.replace(/<[^>]*>/g, ''); // Remove all HTML tags

  // Check for plain text format with --- separator
  if (content.includes('---')) {
    const parts = content.split('---');
    if (parts.length > 0) {
      const className = parts[0].trim();
      if (className) {
        return sanitizeClassName(className);
      }
    }
  }

  // Check for <<stereotype>> notation
  if (content.includes('<<') && content.includes('>>')) {
    // Extract content after stereotype
    const afterStereotype = content.split('>>')[1];
    if (afterStereotype) {
      const words = afterStereotype.trim().split(/[\r\n]+/);
      if (words.length > 0) {
        return sanitizeClassName(words[0].trim());
      }
    }
  }

  // Get the first line/word as class name
  const lines = content.split(/[\r\n]+/).filter((line) => line.trim().length > 0);
  if (lines.length > 0) {
    const firstLine = lines[0].trim();
    // Skip if it starts with visibility modifier (it's an attribute/method)
    if (!firstLine.match(/^[+\-#~]\s/)) {
      return sanitizeClassName(firstLine);
    }
  }

  // Fallback: get first meaningful word
  const words = content.split(/\s+/).filter((word) => word.length > 0);
  if (words.length > 0) {
    return sanitizeClassName(words[0]);
  }

  return '';
};

export const parseClassContent = (label: string): string[] => {
  if (!label) return [];

  // First decode HTML entities properly
  let content = label
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ');

  const members: string[] = [];
  let lines: string[] = [];

  // Check if content has HTML formatting or plain text formatting
  if (content.includes('<hr')) {
    // HTML format: Split by <hr> tags to separate sections
    const sections = content.split(/<hr[^>]*>/);

    // Process each section after the first (skip title section)
    for (let i = 1; i < sections.length; i++) {
      const section = sections[i];
      // Remove paragraph tags but keep content
      let cleanSection = section.replace(/<\/p>/g, '').replace(/<p[^>]*>/g, '');
      // Split by <br> tags to get individual lines
      const sectionLines = cleanSection
        .split(/<br[^>]*>/g)
        .map((line) => line.replace(/<[^>]*>/g, '').trim())
        .filter((line) => line.length > 0);
      lines.push(...sectionLines);
    }
  } else if (content.includes('---')) {
    // Plain text format with --- separator
    const parts = content.split('---');
    if (parts.length > 1) {
      // Skip the first part (class name) and process the rest
      for (let i = 1; i < parts.length; i++) {
        const sectionLines = parts[i]
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter((line) => line.length > 0);
        lines.push(...sectionLines);
      }
    }
  } else {
    // Fallback: split by newlines
    lines = content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .slice(1); // Skip first line (class name)
  }

  // Process each line
  for (const line of lines) {
    const cleanLine = line.trim();

    if (!cleanLine) continue;

    // Skip horizontal lines and empty content
    if (cleanLine === '---' || cleanLine.match(/^-+$/)) continue;

    if (cleanLine.includes('(') && cleanLine.includes(')')) {
      // Method - parse and clean up
      const visibility = cleanLine.startsWith('+')
        ? '+'
        : cleanLine.startsWith('-')
        ? '-'
        : cleanLine.startsWith('#')
        ? '#'
        : cleanLine.startsWith('~')
        ? '~'
        : '+';

      let method = cleanLine.replace(/^[+\-#~]\s*/, '').trim();

      // Clean up double colons (::) that might appear in the format
      method = method.replace(/\s*:\s*:\s*/g, ': ');

      if (method) {
        members.push(`${visibility}${method}`);
      }
    } else if (
      cleanLine.startsWith('+') ||
      cleanLine.startsWith('-') ||
      cleanLine.startsWith('#') ||
      cleanLine.startsWith('~')
    ) {
      // Attribute with visibility modifier
      const visibility = cleanLine.startsWith('+')
        ? '+'
        : cleanLine.startsWith('-')
        ? '-'
        : cleanLine.startsWith('#')
        ? '#'
        : cleanLine.startsWith('~')
        ? '~'
        : '-';

      const attribute = cleanLine.replace(/^[+\-#~]\s*/, '').trim();
      if (attribute) {
        members.push(`${visibility}${attribute}`);
      }
    }
  }

  return members;
};

export const getShapeLabel = (shapes: Shape[], shapeId: string | undefined): string => {
  if (!shapeId) return '';

  const shape = shapes.find((s) => s.Id === shapeId);
  return shape?.Label || '';
};

export const isCardinalityLabel = (shape: Shape): boolean => {
  const label = shape.Label?.trim() || '';
  // Check if it's a simple cardinality notation
  return (
    /^(\d+|\*|0\.\.1|1\.\.\*|0\.\.\*|\d+\.\.\d+|[mn])$/.test(label) ||
    (label === '' && shape.Id.match(/^[_\-]?\d+$/) !== null)
  );
};
