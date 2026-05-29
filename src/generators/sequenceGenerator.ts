import { Diagram, Shape } from '../types.js';
import { sanitizeLabel } from '../utils/labelUtils.js';

export const generateSequenceDiagram = (diagram: Diagram): string => {
  let mermaidSyntax = 'sequenceDiagram\n';

  const participants: Shape[] = [];
  const actors: Shape[] = [];
  const messages: Shape[] = [];
  const notes: Shape[] = [];
  const frames: Shape[] = [];
  let hasSequenceNumbers = false;

  // Separate shapes by type
  for (const shape of diagram.Shapes) {
    if (shape.IsEdge) {
      messages.push(shape);
    } else if (shape.ParticipantType === 'actor') {
      actors.push(shape);
    } else if (shape.ParticipantType === 'participant') {
      participants.push(shape);
    } else if (shape.ParticipantType === 'note') {
      notes.push(shape);
    } else if (shape.ParticipantType === 'frame') {
      frames.push(shape);
    } else if (shape.ParticipantType === 'activation') {
      // Skip activation boxes - they're visual elements, not participants
      continue;
    } else if (shape.Label && /^\d+$/.test(shape.Label.trim())) {
      // Skip numeric labels (sequence numbers) but note their presence
      hasSequenceNumbers = true;
      continue;
    } else if (shape.Label && /^\[.*\]$/.test(shape.Label.trim())) {
      // Skip frame section labels like [Broadcast to subscribers]
      continue;
    } else if (!shape.Label || shape.Label.trim().length === 0) {
      // Skip shapes with no label
      continue;
    } else {
      // Default to participant for untyped shapes
      participants.push(shape);
    }
  }

  // Helper to generate short alias from participant name
  const generateAlias = (label: string, existingAliases: Set<string>): string => {
    if (!label || label.trim().length === 0) {
      return 'P' + Math.random().toString(36).substr(2, 4);
    }

    // Try to create meaningful short alias
    // Split on common delimiters and take first letters or meaningful words
    const words = label.split(/[\s/()]+/).filter((w) => w.length > 0);

    if (words.length === 1) {
      // Single word - try first letter, then first 2-3 letters
      let alias = words[0].charAt(0).toUpperCase();
      if (existingAliases.has(alias)) {
        alias = words[0].substring(0, Math.min(3, words[0].length));
      }

      // If still conflicts, add number
      let counter = 1;
      let finalAlias = alias;
      while (existingAliases.has(finalAlias)) {
        finalAlias = alias + counter++;
      }
      return finalAlias;
    } else {
      // Multiple words - use initials
      let alias = words.map((w) => w.charAt(0).toUpperCase()).join('');

      // If too long, take first 4 characters
      if (alias.length > 4) {
        alias = alias.substring(0, 4);
      }

      // Handle conflicts
      let counter = 1;
      let finalAlias = alias;
      while (existingAliases.has(finalAlias)) {
        finalAlias = alias.substring(0, 3) + counter++;
      }
      return finalAlias;
    }
  };

  const aliasMap = new Map<string, string>();
  const usedAliases = new Set<string>();

  // Add autonumber if sequence numbers were detected
  if (hasSequenceNumbers) {
    mermaidSyntax += '  autonumber\n\n';
  }

  // Generate actor declarations first
  for (const actor of actors) {
    const actorName = sanitizeLabel(actor.Label) || actor.Id;
    const alias = generateAlias(actorName, usedAliases);
    usedAliases.add(alias);
    aliasMap.set(actor.Id, alias);
    mermaidSyntax += `  actor ${alias} as ${actorName}\n`;
  }

  // Generate participant declarations
  for (const participant of participants) {
    const participantName = sanitizeLabel(participant.Label) || participant.Id;
    const alias = generateAlias(participantName, usedAliases);
    usedAliases.add(alias);
    aliasMap.set(participant.Id, alias);
    mermaidSyntax += `  participant ${alias} as ${participantName}\n`;
  }

  for (const activation of diagram.Shapes.filter((shape) => shape.ParticipantType === 'activation')) {
    const parentAlias = activation.ParentNode ? aliasMap.get(activation.ParentNode) : undefined;
    if (parentAlias) {
      aliasMap.set(activation.Id, parentAlias);
    }
  }

  // Generate message flows
  for (const message of messages) {
    let from = message.FromNode || '';
    let to = message.ToNode || '';
    const messageText = sanitizeLabel(message.Label) || '';

    // Map IDs to aliases
    from = aliasMap.get(from) || ensureEndpointAlias(from, aliasMap, usedAliases);
    to = aliasMap.get(to) || ensureEndpointAlias(to, aliasMap, usedAliases);

    if (from && to) {
      // Determine arrow type based on style
      const arrow = message.Style.LinePattern === 2 ? '-->' : '->';
      mermaidSyntax += `  ${from}${arrow}${to}: ${messageText}\n`;
    }
  }

  return mermaidSyntax;
};

const ensureEndpointAlias = (
  id: string,
  aliasMap: Map<string, string>,
  usedAliases: Set<string>
): string => {
  if (!id) return '';

  const existingAlias = aliasMap.get(id);
  if (existingAlias) {
    return existingAlias;
  }

  const base = sanitizeSequenceAlias(id);
  let alias = base;
  let counter = 1;
  while (usedAliases.has(alias)) {
    alias = `${base}${counter++}`;
  }

  usedAliases.add(alias);
  aliasMap.set(id, alias);
  return alias;
};

const sanitizeSequenceAlias = (id: string): string => {
  const sanitized = id.replace(/[^a-zA-Z0-9_]/g, '_');
  return /^[a-zA-Z_]/.test(sanitized) ? sanitized : `P_${sanitized}`;
};
