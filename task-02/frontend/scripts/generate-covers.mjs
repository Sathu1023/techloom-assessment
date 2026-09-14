import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const books = [
  { slug: 'the-midnight-library', title: 'The Midnight Library', author: 'Matt Haig', accent: '#7c3aed', deep: '#2e1065', icon: '🌙' },
  { slug: 'project-hail-mary', title: 'Project Hail Mary', author: 'Andy Weir', accent: '#2563eb', deep: '#1e3a8a', icon: '🚀' },
  { slug: 'evelyn-hugo', title: 'The Seven Husbands of Evelyn Hugo', author: 'Taylor Jenkins Reid', accent: '#be185d', deep: '#831843', icon: '🎬' },
  { slug: 'atomic-habits', title: 'Atomic Habits', author: 'James Clear', accent: '#0f5e2f', deep: '#052e16', icon: '⚛️' },
  { slug: 'educated', title: 'Educated', author: 'Tara Westover', accent: '#b45309', deep: '#78350f', icon: '🎓' },
  { slug: 'sapiens', title: 'Sapiens', author: 'Yuval Noah Harari', accent: '#0f766e', deep: '#134e4a', icon: '🌍' },
  { slug: 'clean-code', title: 'Clean Code', author: 'Robert C. Martin', accent: '#1d4ed8', deep: '#1e3a8a', icon: '</>' },
  { slug: 'pragmatic-programmer', title: 'The Pragmatic Programmer', author: 'Hunt & Thomas', accent: '#4338ca', deep: '#312e81', icon: '🛠️' },
  { slug: 'ddia', title: 'Designing Data-Intensive Applications', author: 'Martin Kleppmann', accent: '#0e7490', deep: '#164e63', icon: '💾' },
  { slug: 'wild-things', title: 'Where the Wild Things Are', author: 'Maurice Sendak', accent: '#c2410c', deep: '#7c2d12', icon: '🌲' },
  { slug: 'hungry-caterpillar', title: 'The Very Hungry Caterpillar', author: 'Eric Carle', accent: '#16a34a', deep: '#14532d', icon: '🐛' },
  { slug: 'charlottes-web', title: "Charlotte's Web", author: 'E. B. White', accent: '#7c3aed', deep: '#4c1d95', icon: '🕸️' },
  { slug: 'seven-habits', title: 'The 7 Habits of Highly Effective People', author: 'Stephen R. Covey', accent: '#0d9488', deep: '#115e59', icon: '🌱' },
  { slug: 'think-and-grow-rich', title: 'Think and Grow Rich', author: 'Napoleon Hill', accent: '#ca8a04', deep: '#713f12', icon: '💡' },
  { slug: 'power-of-now', title: 'The Power of Now', author: 'Eckhart Tolle', accent: '#4f46e5', deep: '#312e81', icon: '✨' },
  { slug: 'lean-startup', title: 'The Lean Startup', author: 'Eric Ries', accent: '#0369a1', deep: '#0c4a6e', icon: '📈' },
  { slug: 'good-to-great', title: 'Good to Great', author: 'Jim Collins', accent: '#1e3a5f', deep: '#0f172a', icon: '🏆' },
  { slug: 'start-with-why', title: 'Start With Why', author: 'Simon Sinek', accent: '#b45309', deep: '#7c2d12', icon: '🎯' },
];

function escapeXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function wrap(text, maxChars) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = w;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 4);
}

function svgFor(book) {
  const titleLines = wrap(book.title, 16);
  const titleStart = 250 - ((titleLines.length - 1) * 18);
  const titleTspans = titleLines.map((line, i) =>
    `<tspan x="220" dy="${i === 0 ? 0 : 36}">${escapeXml(line)}</tspan>`
  ).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600">
  <defs>
    <linearGradient id="bg-${book.slug}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${book.deep}"/>
      <stop offset="100%" stop-color="${book.accent}"/>
    </linearGradient>
  </defs>
  <rect width="400" height="600" fill="url(#bg-${book.slug})"/>
  <rect x="0" y="0" width="22" height="600" fill="#000" opacity="0.28"/>
  <rect x="36" y="36" width="328" height="528" fill="none" stroke="#fff" stroke-opacity="0.28" stroke-width="2"/>
  <text x="220" y="120" text-anchor="middle" font-size="42">${book.icon}</text>
  <text x="220" y="${titleStart}" text-anchor="middle" fill="#ffffff" font-family="Georgia, 'Times New Roman', serif" font-size="28" font-weight="700">${titleTspans}</text>
  <line x1="140" y1="430" x2="300" y2="430" stroke="#fff" stroke-opacity="0.45" stroke-width="1.5"/>
  <text x="220" y="468" text-anchor="middle" fill="#ffffff" fill-opacity="0.9" font-family="Inter, Arial, sans-serif" font-size="16" letter-spacing="1">${escapeXml(book.author)}</text>
  <text x="220" y="530" text-anchor="middle" fill="#ffffff" fill-opacity="0.55" font-family="Inter, Arial, sans-serif" font-size="11" letter-spacing="3">BOOKNEST</text>
</svg>
`;
}

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'covers');
for (const book of books) {
  writeFileSync(join(outDir, `${book.slug}.svg`), svgFor(book));
}
console.log(`Wrote ${books.length} covers to ${outDir}`);
