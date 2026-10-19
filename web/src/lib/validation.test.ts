import { describe, expect, it } from 'vitest';
import { hasErrors, validateImageFile, validateLogin, validatePost, validateRegister } from './validation';

describe('login validation', () => {
  it('accepts a valid email and a password', () => expect(hasErrors(validateLogin({ email: 'a@b.co', password: 'x' }))).toBe(false));
  it('rejects a malformed email and an empty password', () => {
    const e = validateLogin({ email: 'nope', password: '' });
    expect(e.email).toBeDefined();
    expect(e.password).toBeDefined();
  });
});

describe('register validation (mirrors the backend rules)', () => {
  const ok = { username: 'maya_1', displayName: 'Maya', email: 'm@x.io', password: 'longenough' };
  it('accepts valid input', () => expect(hasErrors(validateRegister(ok))).toBe(false));
  it('rejects bad usernames', () => {
    for (const u of ['ab', 'has space', 'bad-char', 'x'.repeat(31)]) {
      expect(validateRegister({ ...ok, username: u }).username).toBeDefined();
    }
  });
  it('enforces 8–72 character passwords', () => {
    expect(validateRegister({ ...ok, password: 'short' }).password).toBeDefined();
    expect(validateRegister({ ...ok, password: 'p'.repeat(73) }).password).toBeDefined();
    expect(validateRegister({ ...ok, password: 'p'.repeat(72) }).password).toBeUndefined();
  });
  it('requires a display name', () => expect(validateRegister({ ...ok, displayName: '  ' }).displayName).toBeDefined());
});

describe('post and image validation', () => {
  it('needs an image', () => expect(validatePost({ caption: 'hi', hasImage: false }).image).toBeDefined());
  it('limits the caption to 2200 characters', () => {
    expect(validatePost({ caption: 'x'.repeat(2201), hasImage: true }).caption).toBeDefined();
    expect(hasErrors(validatePost({ caption: 'x'.repeat(2200), hasImage: true }))).toBe(false);
  });
  it('accepts JPEG, PNG and WebP up to 5 MB only', () => {
    expect(validateImageFile({ type: 'image/png', size: 1000 })).toBeNull();
    expect(validateImageFile({ type: 'image/webp', size: 5 * 1024 * 1024 })).toBeNull();
    expect(validateImageFile({ type: 'image/gif', size: 1000 })).not.toBeNull();
    expect(validateImageFile({ type: 'image/jpeg', size: 5 * 1024 * 1024 + 1 })).not.toBeNull();
  });
});
