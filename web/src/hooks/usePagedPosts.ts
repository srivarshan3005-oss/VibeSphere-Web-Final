import { useCallback, useEffect, useRef, useState } from 'react';
import { api, getErrorMessage, type Post } from '../lib/api';
import { subscribePostEvents } from '../lib/events';

type Options = { pageSize?: number; acceptCreated?: (p: Post) => boolean };

/**
 * Paginated post list with refresh, duplicate-request guards and optimistic like/unlike (rolled back if the
 * request fails). Create/delete/edit/comment events from other pages keep the list in sync.
 */
export function usePagedPosts(fetchPage: (page: number, size: number) => Promise<Post[]>, { pageSize = 10, acceptCreated }: Options = {}) {
  const [items, setItems] = useState<Post[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const nextPage = useRef(0);
  const busy = useRef(false);
  const liking = useRef(new Set<number>());
  const alive = useRef(true);
  const generation = useRef(0); // bumps when the data source changes, so stale responses are dropped
  const acceptRef = useRef(acceptCreated);

  useEffect(() => {
    acceptRef.current = acceptCreated;
  });

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const load = useCallback(
    async (reset: boolean, mode: 'initial' | 'refresh' | 'more') => {
      if (busy.current) return; // never run two page loads at once
      busy.current = true;
      const gen = generation.current;
      if (mode === 'refresh') setRefreshing(true);
      if (mode === 'more') setLoadingMore(true);
      try {
        const page = reset ? 0 : nextPage.current;
        const data = await fetchPage(page, pageSize);
        if (!alive.current || gen !== generation.current) return;
        setItems(prev => {
          if (reset) return data;
          const seen = new Set(prev.map(p => p.id));
          return [...prev, ...data.filter(p => !seen.has(p.id))];
        });
        nextPage.current = page + 1;
        setHasMore(data.length >= pageSize);
        setStatus('ready');
        setError(null);
      } catch (e) {
        if (!alive.current || gen !== generation.current) return;
        const msg = getErrorMessage(e, 'Could not load posts.');
        if (mode === 'more' || mode === 'refresh') {
          setNotice(msg);
        } else {
          setError(msg);
          setStatus('error');
        }
      } finally {
        if (gen === generation.current) busy.current = false;
        if (alive.current && gen === generation.current) {
          setRefreshing(false);
          setLoadingMore(false);
        }
      }
    },
    [fetchPage, pageSize],
  );

  useEffect(() => {
    generation.current += 1;
    busy.current = false;
    setStatus('loading');
    setItems([]);
    nextPage.current = 0;
    setHasMore(true);
    void load(true, 'initial');
  }, [load]);

  useEffect(
    () =>
      subscribePostEvents(e => {
        if (e.type === 'created' && acceptRef.current?.(e.post)) {
          setItems(prev => (prev.some(p => p.id === e.post.id) ? prev : [e.post, ...prev]));
        } else if (e.type === 'deleted') {
          setItems(prev => prev.filter(p => p.id !== e.id));
        } else if (e.type === 'updated') {
          setItems(prev => prev.map(p => (p.id === e.post.id ? e.post : p)));
        } else if (e.type === 'commentsDelta') {
          setItems(prev => prev.map(p => (p.id === e.id ? { ...p, commentsCount: Math.max(0, p.commentsCount + e.delta) } : p)));
        }
      }),
    [],
  );

  const refresh = useCallback(() => load(true, 'refresh'), [load]);
  const reload = useCallback(() => {
    setStatus('loading');
    return load(true, 'initial');
  }, [load]);
  const loadMore = useCallback(() => {
    if (hasMore && status === 'ready') void load(false, 'more');
  }, [hasMore, status, load]);

  const toggleLike = useCallback(async (post: Post) => {
    if (liking.current.has(post.id)) return; // ignore double clicks while a request is in flight
    liking.current.add(post.id);
    const before = { likedByMe: post.likedByMe, likesCount: post.likesCount };
    const patch = (v: Partial<Post>) => setItems(prev => prev.map(p => (p.id === post.id ? { ...p, ...v } : p)));
    patch({ likedByMe: !before.likedByMe, likesCount: Math.max(0, before.likesCount + (before.likedByMe ? -1 : 1)) });
    try {
      const res = await api.post<{ likedByMe: boolean; likesCount: number }>(`/posts/${post.id}/like`);
      if (alive.current) patch(res.data);
    } catch (e) {
      if (alive.current) {
        patch(before);
        setNotice(getErrorMessage(e, 'Could not update your like.'));
      }
    } finally {
      liking.current.delete(post.id);
    }
  }, []);

  const clearNotice = useCallback(() => setNotice(null), []);
  return { items, status, error, notice, clearNotice, refreshing, loadingMore, hasMore, refresh, reload, loadMore, toggleLike };
}
