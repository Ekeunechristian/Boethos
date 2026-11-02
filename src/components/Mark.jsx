// Boēthos (βοηθός, "helper"): the shepherd’s crook across the open Word.
// The two sections have round marks of their own: Spoudazō an open book, Poimainō a shepherd's crook.
const CREAM = '#F4F0E2';
export default function Mark({ size, kind = 'boethos' }) {
  const style = size ? { width: size, height: size } : undefined;
  if (kind === 'poimaino') return (
    <svg className="brand-l" viewBox="0 0 32 32" aria-hidden="true" style={style}>
      <circle cx="16" cy="16" r="16" fill="#4E6234" />
      <path d="M19.5 26 V12 A5 5 0 0 0 9.5 12 V14.5" fill="none" stroke={CREAM} strokeWidth="2.8" strokeLinecap="round" />
      <path d="M6 23.5 q2.1 -1.6 4.2 0 t4.2 0" fill="none" stroke={CREAM} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
  if (kind === 'spoudazo') return (
    <svg className="brand-l" viewBox="0 0 32 32" aria-hidden="true" style={style}>
      <circle cx="16" cy="16" r="16" fill="#7A5A2E" />
      <path d="M16 11.5 C13 9.5 9.5 9.5 7.5 10.5 V22 C9.5 21 13 21 16 23 C19 21 22.5 21 24.5 22 V10.5 C22.5 9.5 19 9.5 16 11.5 Z M16 11.5 V23" fill="none" stroke={CREAM} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
  // Boēthos: the shepherd's crook laid across the open Word, its hook gathering a light.
  // The book is your own walk with God (Spoudazō); the crook is shepherding others (Poimainō); the light is the one helped.
  return (
    <svg className="brand-l" viewBox="0 0 32 32" aria-hidden="true" style={style}>
      <rect width="32" height="32" rx="8" fill="#4E6234" />
      <path d="M16 23.2 C13 21.4 9.4 21.2 6 22.4 V25.6 C9.4 24.4 13 24.6 16 26.4 C19 24.6 22.6 24.4 26 25.6 V22.4 C22.6 21.2 19 21.4 16 23.2 Z" fill={CREAM} />
      <path d="M7.5 21 L18.5 7.8 A5 5 0 1 1 25 14.6" fill="none" stroke="#E0B45A" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="21.8" cy="9.6" r="2.1" fill={CREAM} />
    </svg>
  );
}
