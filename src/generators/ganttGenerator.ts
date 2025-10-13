import { Diagram } from '../types.js';
import { sanitizeLabel } from '../utils/labelUtils.js';

export const generateGanttDiagram = (diagram: Diagram): string => {
  const tasks: any[] = [];
  const sections: Set<string> = new Set();

  // Extract tasks from shapes
  for (const shape of diagram.Shapes) {
    if (!shape.IsEdge && shape.Label) {
      const taskText = sanitizeLabel(shape.Label);
      const section = 'Tasks'; // Default section
      sections.add(section);

      tasks.push({
        section: section,
        name: taskText,
        id: `task_${shape.Id}`,
        start: '2024-01-01',
        duration: '1d',
      });
    }
  }

  let mermaidCode = 'gantt\n';
  mermaidCode += '    title Project Timeline\n';
  mermaidCode += '    dateFormat YYYY-MM-DD\n';

  for (const section of sections) {
    mermaidCode += `    section ${section}\n`;
    const sectionTasks = tasks.filter((t) => t.section === section);

    for (const task of sectionTasks) {
      mermaidCode += `    ${task.name} :${task.id}, ${task.start}, ${task.duration}\n`;
    }
  }

  return mermaidCode;
};
