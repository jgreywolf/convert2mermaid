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
    case 'circle':
    case 'oval':
      return 6; // Circle arrow
    case 'circle_outline':
      return 7; // Circle outline arrow
    case 'diamond':
      return 8; // Diamond arrow
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