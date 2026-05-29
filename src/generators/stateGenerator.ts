import { Diagram, Shape } from '../types.js';
import { sanitizeLabel } from '../utils/labelUtils.js';

const sanitizeStateId = (id: string): string => {
  const sanitized = id.replace(/[^a-zA-Z0-9_]/g, '_');
  return /^[a-zA-Z_]/.test(sanitized) ? sanitized : `state_${sanitized}`;
};

export const generateStateDiagram = (diagram: Diagram): string => {
  let mermaidSyntax = 'stateDiagram-v2\n';

  const states: Shape[] = [];
  const transitions: Shape[] = [];
  const stateIds = new Map<string, string>();

  // Separate states from transitions
  for (const shape of diagram.Shapes) {
    if (shape.IsEdge) {
      transitions.push(shape);
    } else {
      states.push(shape);
      stateIds.set(shape.Id, getStateId(shape));
    }
  }

  // Generate state definitions
  for (const state of states) {
    const stateName = sanitizeLabel(state.Label) || state.Id;
    const stateId = stateIds.get(state.Id) || getStateId(state);
    if (stateId !== '[*]') {
      mermaidSyntax += `  state "${stateName}" as ${stateId}\n`;
    }
  }

  // Generate transitions
  for (const transition of transitions) {
    const from = transition.FromNode ? stateIds.get(transition.FromNode) || sanitizeStateId(transition.FromNode) : '';
    const to = transition.ToNode ? stateIds.get(transition.ToNode) || sanitizeStateId(transition.ToNode) : '';
    const trigger = transition.Label ? ` : ${sanitizeLabel(transition.Label)}` : '';

    if (from && to) {
      mermaidSyntax += `  ${from} --> ${to}${trigger}\n`;
    }
  }

  return mermaidSyntax;
};

const getStateId = (state: Shape): string => {
  const label = sanitizeLabel(state.Label).toLowerCase();
  const id = state.Id.toLowerCase();
  const shapeType = state.ShapeType.toLowerCase();
  const isUnlabeled = label.length === 0;

  if (
    shapeType.includes('startstate') ||
    shapeType.includes('endstate') ||
    (isUnlabeled && (id === 'initial' || id === 'final' || id.includes('initialstate') || id.includes('finalstate')))
  ) {
    return '[*]';
  }

  return sanitizeStateId(state.Id);
};
