import { Style } from '../types.js';

/**
 * Creates a default style object with sensible defaults
 */
export const createDefaultStyle = (): Style => ({
  FillForeground: '',
  FillBackground: '',
  TextColor: '',
  LineWeight: 1,
  LineColor: '',
  LinePattern: 0,
  Rounding: 0,
  BeginArrow: 0,
  BeginArrowSize: 0,
  EndArrow: 0,
  EndArrowSize: 0,
  LineCap: 0,
  FillPattern: 0,
});

/**
 * Maps arrow types from various formats to standardized numeric values
 */
export const mapArrowTypeToNumber = (arrowType: string | null | undefined): number => {
  if (!arrowType) return 0;

  const normalizedType = arrowType.toLowerCase();

  switch (normalizedType) {
    case 'arrow':
    case 'triangle':
    case 'classic':
      return 1; // Standard arrow
    case 'triangle_outline':
    case 'open':
    case 'block':
      return 2; // Outline/filled arrow
    case 'blockthin':
      return 3; // Thin block arrow (inheritance)
    case 'openthin':
      return 4; // Thin open arrow (interface implementation)
    case 'dash':
    case 'dashedopen':
      return 5; // Dashed arrow (dependency)
    case 'circle':
    case 'oval':
      return 6; // Circle arrow
    case 'circle_outline':
    case 'circlePlus':
      return 7; // Circle outline arrow
    case 'diamond':
    case 'diamondthin':
      return 8; // Diamond arrow (aggregation/composition)
    case 'diamond_outline':
      return 9; // Diamond outline arrow
    case 'cross':
      return 10; // Cross arrow
    case 'none':
    default:
      return 0; // No arrow
  }
};

/**
 * Maps line/stroke patterns to standardized numeric values
 */
export const mapLinePatternToNumber = (pattern: string | undefined): number => {
  if (!pattern) return 0;

  const normalizedPattern = pattern.toLowerCase();

  switch (normalizedPattern) {
    case 'solid':
      return 0;
    case 'dashed':
    case 'dash':
      return 1;
    case 'dotted':
    case 'dot':
      return 2;
    case 'dashdot':
    case 'dash-dot':
      return 3;
    default:
      return 0; // Default to solid
  }
};

/**
 * Maps fill patterns to standardized numeric values
 */
export const mapFillPatternToNumber = (pattern: string | undefined): number => {
  if (!pattern) return 0;

  const normalizedPattern = pattern.toLowerCase();

  switch (normalizedPattern) {
    case 'none':
    case 'transparent':
      return 0;
    case 'solid':
      return 1;
    case 'hachure':
    case 'diagonal':
      return 2;
    case 'cross-hatch':
    case 'cross':
      return 6;
    default:
      return 0; // Default to no fill
  }
};

/**
 * Generates CSS style statement for a shape
 */
export const getStyleStatement = (style: Style): string => {
  let styleStatement = '';

  // Handle fill properties
  if (style.FillForeground && style.FillBackground && style.FillPattern !== undefined) {
    switch (style.FillPattern) {
      case 0:
        // No fill
        styleStatement += `fill: none,`;
        break;
      case 1:
        // Solid fill, foreground color only
        styleStatement += `fill: ${style.FillForeground},`;
        break;
      case 2:
        // Horizontal stripes example (customize based on pattern type)
        styleStatement += `background: repeating-linear-gradient(0deg, ${style.FillForeground}, ${style.FillForeground} 10px, ${style.FillBackground} 10px, ${style.FillBackground} 20px),`;
        break;
      case 6:
        // Crosshatch fill example
        styleStatement += `background: repeating-linear-gradient(45deg, ${style.FillForeground}, ${style.FillForeground} 10px, ${style.FillBackground} 10px, ${style.FillBackground} 20px),`;
        break;
      // Add more cases here for different fill patterns
      default:
        styleStatement += `fill: ${style.FillForeground},`; // Default solid fill
    }
  }

  if (style.LineWeight && style.LineWeight > 2) {
    styleStatement += `stroke-width: ${Math.round(style.LineWeight)},`; // LineWeight to stroke-width
  }

  if (style.LineColor) {
    styleStatement += `stroke: ${style.LineColor},`;
  }

  if (style.LinePattern) {
    switch (style.LinePattern) {
      case 1:
        // Dashed line
        styleStatement += `stroke-dasharray: 5, 5,`; // Customizable dash length
        break;
      case 2:
        // Dotted line
        styleStatement += `stroke-dasharray: 1, 5,`;
        break;
      case 3:
        // Dash-dot line
        styleStatement += `stroke-dasharray: 5, 5, 1, 5,`;
        break;
      // Add more cases for other line patterns as needed
    }
  }

  if (style.Rounding && style.Rounding > 0) {
    styleStatement += `border-radius: ${style.Rounding}px,`;
  }

  // Handle line caps (start and end of lines)
  if (style.LineCap) {
    switch (style.LineCap) {
      case 0:
        styleStatement += `stroke-linecap: butt,`; // Flat ends
        break;
      case 1:
        styleStatement += `stroke-linecap: round,`; // Rounded ends
        break;
      case 2:
        styleStatement += `stroke-linecap: square,`; // Square ends
        break;
    }
  }

  if (style.FillForeground && styleStatement.indexOf('fill') === -1) {
    styleStatement += `fill: ${style.FillForeground},`;
  }

  return styleStatement.trim().replace(/,$/, '');
};

/**
 * Builds an edge statement with proper arrow notation
 */
export const buildEdgeStatement = (
  start: string,
  end: string,
  style: Style,
  text: string,
  sanitizeEdgeLabelFn: (text: string) => string
): string => {
  let startArrow = getArrow(style.BeginArrow);
  let endArrow = getArrow(style.EndArrow);

  // Sanitize the edge label text with special handling for edge labels
  const sanitizedText = sanitizeEdgeLabelFn(text);

  switch (startArrow) {
    case '>':
      startArrow = '<';
      break;
    case '&':
      startArrow = '';
  }

  // we are making an assumption here that if the EndArrow prop was NaN, then default to normal arrow
  if (endArrow === '&') {
    endArrow = '>';
  }

  let { startStroke, endStroke } = getStroke(style.LinePattern);
  if (startArrow === '' && sanitizedText === '') {
    startStroke = '';
  }

  if (startArrow === '<' && endArrow === '') {
    return `${end} ${endStroke}${sanitizedText}${startStroke}> ${start}`;
  }

  return `${start} ${startArrow}${startStroke}${sanitizedText}${endStroke}${endArrow} ${end}`;
};

/**
 * Gets stroke pattern for edges
 */
export const getStroke = (linePattern: number): { startStroke: string; endStroke: string } => {
  let startStroke = '--';
  let endStroke = '--';

  if (linePattern) {
    switch (linePattern) {
      case 2:
      case 3:
        // Dotted line
        startStroke = '-.';
        endStroke = '.-';
        break;
      // Add more cases for other line patterns as needed
    }
  }

  return { startStroke, endStroke };
};

/**
 * Maps numeric arrow type to Mermaid arrow symbol
 */
export function getArrow(arrow: number): string {
  if (isNaN(arrow)) {
    return '&';
  }

  switch (arrow) {
    case 0:
      return ''; // No arrow
    case 1:
      return '>'; // Basic arrow
    case 2:
      return 'x'; // Cross arrow (supported in flowcharts)
    case 3:
      return 'o'; // Circle (hollow) (supported in flowcharts)
    case 4:
      return 'o'; // Circle (filled) - map to hollow circle for flowchart compatibility
    case 5:
      return '>'; // Square - map to standard arrow for flowchart compatibility
    case 6:
      return 'o'; // Diamond (hollow) - map to circle for flowchart compatibility
    case 7:
      return 'o'; // Diamond (filled) - map to circle for flowchart compatibility
    case 8:
      return '>'; // Triangle outline - map to standard arrow for flowchart compatibility
    case 9:
      return '>'; // Triangle filled (standard arrow)
    case 10:
      return '>'; // Bar/line end - map to standard arrow for flowchart compatibility
    case 11:
      return 'o'; // Crowfoot many - map to circle for flowchart compatibility
    case 12:
      return 'o'; // Crowfoot one or many - map to circle for flowchart compatibility
    default:
      return '>'; // Default to standard arrow
  }
}

// TODO: For future diagram types (ERD, Class diagrams, etc.), consider supporting additional arrow types:
// case 4: return '*'; // Circle (filled) - for ERD/Class diagrams
// case 5: return ']'; // Square - for ERD/Class diagrams
// case 8: return '<'; // Triangle outline - for ERD/Class diagrams
// case 10: return '|'; // Bar/line end - for ERD/Class diagrams
// case 11: return '}'; // Crowfoot many - for ERD diagrams
// case 12: return '{'; // Crowfoot one or many - for ERD diagrams
