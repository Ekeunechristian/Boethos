// Completion gates: a step marked { gate: true } is passed by ticking its "✓" checklist.
// The shepherding plan has none yet, so these simply find nothing.
export function gateSections(step) {
  if (!step?.gate) return null;
  const blocks = String(step.description).split(/\n\s*\n/);
  const intro = [], sections = [], outro = [];
  blocks.forEach(b => {
    const lines = b.split('\n');
    const items = lines.filter(l => l.trim().startsWith('✓'));
    if (items.length) sections.push({ title: lines[0].trim().startsWith('✓') ? 'Checks' : lines[0].replace(/:$/, '').trim(), items: items.map(l => l.trim().replace(/^✓\s*/, '')) });
    else (sections.length ? outro : intro).push(b);
  });
  return { intro: intro.join('\n\n'), sections, outro: outro.join('\n\n'), total: sections.reduce((n, s) => n + s.items.length, 0) };
}
export const gateKey = (section, i) => `${section.title}#${i}`;
