import { inflateRawSync } from 'zlib';

export const normalizeDrawIOXml = (xmlContent: string): string => {
  if (xmlContent.includes('<mxGraphModel')) {
    return xmlContent;
  }

  const diagramContents = [...xmlContent.matchAll(/<diagram\b[^>]*>([\s\S]*?)<\/diagram>/g)]
    .map((match) => match[1].trim())
    .filter((content) => content.length > 0);

  for (const diagramContent of diagramContents) {
    const decodedDiagram = decodeCompressedDiagram(diagramContent);
    if (decodedDiagram) {
      return `<mxfile><diagram>${decodedDiagram}</diagram></mxfile>`;
    }
  }

  return xmlContent;
};

const decodeCompressedDiagram = (diagramContent: string): string | undefined => {
  try {
    const inflated = inflateRawSync(Buffer.from(diagramContent, 'base64')).toString('utf-8');

    try {
      return decodeURIComponent(inflated);
    } catch {
      return inflated;
    }
  } catch {
    return undefined;
  }
};
