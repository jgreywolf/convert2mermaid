/**
 * Utility functions for error handling and logging
 */

export interface ParseError extends Error {
  filePath?: string;
  lineNumber?: number;
  context?: string;
}

/**
 * Creates a standardized parse error with additional context
 */
export const createParseError = (
  message: string, 
  filePath?: string, 
  context?: string,
  lineNumber?: number
): ParseError => {
  const error = new Error(message) as ParseError;
  error.name = 'ParseError';
  error.filePath = filePath;
  error.context = context;
  error.lineNumber = lineNumber;
  return error;
};

/**
 * Safely parses JSON with enhanced error reporting
 */
export const safeJsonParse = <T>(jsonString: string, filePath?: string): T => {
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    throw createParseError(
      `Invalid JSON format: ${error instanceof Error ? error.message : 'Unknown error'}`,
      filePath,
      'JSON parsing'
    );
  }
};

/**
 * Logs parsing progress with standardized format
 */
export const logParseProgress = (message: string, filePath?: string): void => {
  const prefix = filePath ? `[${filePath}]` : '[Parser]';
  console.debug(`${prefix} ${message}`);
};

/**
 * Safely reads file with enhanced error reporting
 */
export const safeFileRead = (filePath: string): Buffer => {
  try {
    const fs = require('fs');
    return fs.readFileSync(filePath);
  } catch (error) {
    throw createParseError(
      `Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      filePath,
      'File system'
    );
  }
};

/**
 * Validates required properties on an object
 */
export const validateRequiredProperties = <T extends Record<string, unknown>>(
  obj: unknown, 
  requiredProps: (keyof T)[], 
  context: string
): T => {
  if (!obj || typeof obj !== 'object') {
    throw createParseError(`Expected object but got ${typeof obj}`, undefined, context);
  }

  const typedObj = obj as T;
  for (const prop of requiredProps) {
    if (!(prop in typedObj) || typedObj[prop] === undefined) {
      throw createParseError(`Missing required property: ${String(prop)}`, undefined, context);
    }
  }

  return typedObj;
};