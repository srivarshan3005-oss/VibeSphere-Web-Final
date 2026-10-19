import type { Story } from './api';

export type StoryGroup = { userId: number; username: string; displayName: string; stories: Story[] };

/** Group stories by author (oldest first inside each group, so they play in order) so each person gets one ring. */
export function groupStories(stories: Story[], myId?: number): StoryGroup[] {
  const map = new Map<number, StoryGroup>();
  for (const s of stories) {
    const g: StoryGroup = map.get(s.userId) ?? { userId: s.userId, username: s.username, displayName: s.displayName, stories: [] };
    g.stories.push(s);
    map.set(s.userId, g);
  }
  const groups = [...map.values()];
  groups.forEach(g => g.stories.sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt)));
  return groups.sort((a, b) => (a.userId === myId ? -1 : b.userId === myId ? 1 : 0));
}
