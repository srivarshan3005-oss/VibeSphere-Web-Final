import { ACCEPTED_IMAGE_TYPES, MAX_UPLOAD_BYTES } from './config';

export type FieldErrors<T extends string> = Partial<Record<T, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateLogin(v: { email: string; password: string }): FieldErrors<'email' | 'password'> {
  const e: FieldErrors<'email' | 'password'> = {};
  if (!EMAIL.test(v.email.trim())) e.email = 'Enter a valid email address.';
  if (!v.password) e.password = 'Enter your password.';
  return e;
}

type RegisterField = 'username' | 'displayName' | 'email' | 'password';
export function validateRegister(v: { username: string; displayName: string; email: string; password: string }): FieldErrors<RegisterField> {
  const e: FieldErrors<RegisterField> = {};
  if (!/^[A-Za-z0-9_]{3,30}$/.test(v.username.trim())) e.username = '3–30 characters: letters, numbers or underscore.';
  if (v.displayName.trim().length < 1 || v.displayName.trim().length > 80) e.displayName = 'Enter a display name (up to 80 characters).';
  if (!EMAIL.test(v.email.trim())) e.email = 'Enter a valid email address.';
  if (v.password.length < 8 || v.password.length > 72) e.password = 'Use 8–72 characters.';
  return e;
}

export function validatePost(v: { caption: string; hasImage: boolean }): FieldErrors<'caption' | 'image'> {
  const e: FieldErrors<'caption' | 'image'> = {};
  if (!v.hasImage) e.image = 'Choose a photo to share.';
  if (v.caption.length > 2200) e.caption = 'Captions can be at most 2200 characters.';
  return e;
}

/** Returns an error message when the file cannot be uploaded, otherwise null. */
export function validateImageFile(file: Pick<File, 'type' | 'size'>): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return 'Use a JPEG, PNG or WebP image.';
  if (file.size > MAX_UPLOAD_BYTES) return 'That photo is larger than 5 MB.';
  return null;
}

export const hasErrors = (e: object) => Object.keys(e).length > 0;
