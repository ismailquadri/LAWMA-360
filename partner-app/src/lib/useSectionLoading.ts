import { useEffect, useState } from 'react';

// Small cosmetic delay when switching sidebar sections so the shimmer reads
// as a real fetch. Skipped entirely under prefers-reduced-motion.
export function useSectionLoading(key: string, ms = 400) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(() => setLoading(false), ms);
    return () => clearTimeout(t);
  }, [key, ms]);

  return loading;
}
