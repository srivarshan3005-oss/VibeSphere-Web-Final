import { useEffect, useRef } from 'react';
import Button from './Button';

/** Loads the next page when scrolled into view (where IntersectionObserver exists); the button is the fallback. */
export default function LoadMore({ hasMore, loading, onLoad }: { hasMore: boolean; loading: boolean; onLoad: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const cb = useRef(onLoad);
  useEffect(() => {
    cb.current = onLoad;
  });

  useEffect(() => {
    const el = ref.current;
    if (!el || !hasMore || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) cb.current();
    }, { rootMargin: '400px' });
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, loading]);

  if (!hasMore) return null;
  return (
    <div ref={ref} className="load-more">
      <Button variant="secondary" onClick={onLoad} loading={loading}>
        Load more
      </Button>
    </div>
  );
}
