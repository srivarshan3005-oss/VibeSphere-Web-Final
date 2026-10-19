import { describe, expect, it } from 'vitest';
import { compact, timeAgo } from './format';
import { safeRedirect } from './redirect';
import { groupStories } from './stories';
import type { Story } from './api';

describe('timeAgo', () => {
  const now = Date.parse('2026-01-10T12:00:00Z');
  it('formats recent times', () => {
    expect(timeAgo('2026-01-10T11:59:50Z', now)).toBe('just now');
    expect(timeAgo('2026-01-10T11:30:00Z', now)).toBe('30m');
    expect(timeAgo('2026-01-10T09:00:00Z', now)).toBe('3h');
    expect(timeAgo('2026-01-08T12:00:00Z', now)).toBe('2d');
  });
  it('returns an empty string for bad input', () => expect(timeAgo('not a date', now)).toBe(''));
});

describe('compact', () => {
  it('abbreviates large numbers', () => {
    expect(compact(999)).toBe('999');
    expect(compact(1500)).toBe('1.5K');
    expect(compact(2_000_000)).toBe('2M');
  });
});

describe('safeRedirect', () => {
  it('keeps in-app paths', () => expect(safeRedirect('/explore')).toBe('/explore'));
  it('rejects absolute and protocol-relative URLs', () => {
    expect(safeRedirect('https://evil.example')).toBe('/');
    expect(safeRedirect('//evil.example')).toBe('/');
  });
  it('never redirects back to the auth pages', () => {
    expect(safeRedirect('/login')).toBe('/');
    expect(safeRedirect(undefined)).toBe('/');
  });
});

describe('groupStories', () => {
  const s = (id: number, userId: number, createdAt: string): Story => ({ id, userId, username: `u${userId}`, displayName: `U${userId}`, mediaUrl: '/x.jpg', createdAt, expiresAt: createdAt });
  it('groups by author, plays oldest first and puts your own group first', () => {
    const groups = groupStories([s(3, 2, '2026-01-01T03:00:00Z'), s(2, 1, '2026-01-01T02:00:00Z'), s(1, 2, '2026-01-01T01:00:00Z')], 1);
    expect(groups.map(g => g.userId)).toEqual([1, 2]);
    expect(groups[1].stories.map(x => x.id)).toEqual([1, 3]);
  });
});
