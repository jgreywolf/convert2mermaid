import { Diagram, Shape } from '../types.js';
import { sanitizeLabel } from '../utils/labelUtils.js';

const sanitizeStateId = (id: string): string => {
  const sanitized = id.replace(/[^a-zA-Z0-9_]/g, '_');
  return /^[a-zA-Z_]/.test(sanitized) ? sanitized : `state_${sanitized}`;
};

export const generateStateDiagram = (diagram: Diagram): string => {
  let mermaidSyntax = 'stateDiagram-v2\r\n';

  const states: Shape[] = [];
  const transitions: Shape[] = [];
  const stateIds = new Map<string, string>();

  // Separate states from transitions
  for (const shape of diagram.Shapes) {
    if (shape.IsEdge) {
      transitions.push(shape);
    } else {
      states.push(shape);
      stateIds.set(shape.Id, sanitizeStateId(shape.Id));
    }
  }

  // Generate state definitions
  for (const state of states) {
    const stateName = sanitizeLabel(state.Label) || state.Id;
    const stateId = stateIds.get(state.Id) || sanitizeStateId(state.Id);
    if (stateName.toLowerCase().includes('start') || stateName.toLowerCase().includes('initial')) {
      mermaidSyntax += `  [*] --> ${stateId}\r\n`;
    } else if (stateName.toLowerCase().includes('end') || stateName.toLowerCase().includes('final')) {
      mermaidSyntax += `  ${stateId} --> [*]\r\n`;
    } else {
      mermaidSyntax += `  state "${stateName}" as ${stateId}\r\n`;
    }
  }

  // Generate transitions
  for (const transition of transitions) {
    const from = transition.FromNode ? stateIds.get(transition.FromNode) || sanitizeStateId(transition.FromNode) : '';
    const to = transition.ToNode ? stateIds.get(transition.ToNode) || sanitizeStateId(transition.ToNode) : '';
    const trigger = transition.Label ? ` : ${sanitizeLabel(transition.Label)}` : '';

    if (from && to) {
      mermaidSyntax += `  ${from} --> ${to}${trigger}\r\n`;
    }
  }

  return mermaidSyntax;
};
