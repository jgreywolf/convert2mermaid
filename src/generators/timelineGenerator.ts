import { Diagram } from '../types.js';
import { sanitizeLabel } from '../utils/labelUtils.js';

export const generateTimelineDiagram = (diagram: Diagram): string => {
  const events: any[] = [];

  // Extract timeline events from shapes
  for (const shape of diagram.Shapes) {
    if (!shape.IsEdge && shape.Label) {
      const eventText = sanitizeLabel(shape.Label);
      events.push({
        title: eventText,
        id: `event_${shape.Id}`,
      });
    }
  }

  let mermaidCode = 'timeline\n';
  mermaidCode += '    title Project Timeline\n';

  for (const event of events) {
    mermaidCode += `    ${event.title}\n`;
  }

  return mermaidCode;
};
