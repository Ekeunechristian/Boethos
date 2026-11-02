import { useEffect, useState } from 'react';

// Hash routes: #/today, #/roadmap/phase-1, #/roadmap/phase-1/p1-s2, #/practice/coding …
// Real URLs mean the browser's back button, bookmarks and refresh all work.
function parse() {
  const parts = window.location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  return { page: parts[0] || 'home', parts };
}

export function useRoute() {
  const [route, setRoute] = useState(parse);
  useEffect(() => {
    const on = () => { setRoute(parse()); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

export const href = (...parts) => '#/' + parts.filter(Boolean).map(encodeURIComponent).join('/');
export const go = (...parts) => { window.location.hash = href(...parts).slice(1); };
