import { Diagram, Shape } from '../types.js';
import { sanitizeLabel } from '../utils/labelUtils.js';

export const generateStateDiagram = (diagram: Diagram): string => {
  let mermaidSyntax = 'stateDiagram-v2\r\n';

  const states: Shape[] = [];
  const transitions: Shape[] = [];

  // Separate states from transitions
  for (const shape of diagram.Shapes) {
    if (shape.IsEdge) {
      transitions.push(shape);
    } else {
      states.push(shape);
    }
  }

  // Generate state definitions
  for (const state of states) {
    const stateName = sanitizeLabel(state.Label) || state.Id;
    if (stateName.toLowerCase().includes('start') || stateName.toLowerCase().includes('initial')) {
      mermaidSyntax += `  [*] --> ${state.Id}\r\n`;
    } else if (stateName.toLowerCase().includes('end') || stateName.toLowerCase().includes('final')) {
      mermaidSyntax += `  ${state.Id} --> [*]\r\n`;
    } else {
      mermaidSyntax += `  state "${stateName}" as ${state.Id}\r\n`;
    }
  }

  // Generate transitions
  for (const transition of transitions) {
    const from = transition.FromNode || '';
    const to = transition.ToNode || '';
    const trigger = transition.Label ? ` : ${sanitizeLabel(transition.Label)}` : '';

    if (from && to) {
      mermaidSyntax += `  ${from} --> ${to}${trigger}\r\n`;
    }
  }

  return mermaidSyntax;
};
