import type { Post } from './api';

export type PostEvent =
  | { type: 'created'; post: Post }
  | { type: 'deleted'; id: number }
  | { type: 'updated'; post: Post }
  | { type: 'commentsDelta'; id: number; delta: number };

type Listener = (e: PostEvent) => void;
const listeners = new Set<Listener>();

/** Tiny pub/sub so the Create and Comments pages can update feed and profile lists without a global store. */
export function subscribePostEvents(l: Listener): () => void {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}
export function emitPostEvent(e: PostEvent) {
  listeners.forEach(l => l(e));
}
