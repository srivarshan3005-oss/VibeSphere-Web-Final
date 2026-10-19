import axios from 'axios';
import { API_BASE_URL } from './config';

export type User = {
  id: number;
  username: string;
  displayName: string;
  email?: string;
  bio?: string | null;
  avatarUrl?: string | null;
  createdAt?: string;
};
export type PublicUser = { id: number; username: string; displayName: string; bio?: string | null; avatarUrl?: string | null };
export type Profile = PublicUser & {
  createdAt: string;
  postsCount: number;
  followersCount: number;
  followingCount: number;
  followedByMe: boolean;
  isMe: boolean;
};
export type Post = {
  id: number;
  userId: number;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  caption: string;
  mediaUrl: string;
  mediaType: string;
  visibility: string;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  likedByMe: boolean;
};
export type PostComment = {
  id: number;
  postId: number;
  parentId: number | null;
  userId: number;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  body: string;
  createdAt: string;
};
export type Story = {
  id: number;
  userId: number;
  username: string;
  displayName: string;
  caption?: string | null;
  mediaUrl: string;
  createdAt: string;
  expiresAt: string;
};

/**
 * Authentication is carried by an HttpOnly session cookie that the browser stores and sends by itself
 * (`withCredentials`). JavaScript never sees or stores the token. The X-Requested-With header is required by the
 * backend on cookie-authenticated writes (CSRF defence in depth) and also makes browsers run a CORS preflight.
 */
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 12000,
  withCredentials: true,
  headers: { 'X-Requested-With': 'XMLHttpRequest' },
});

let unauthorizedHandler: (() => void) | null = null;
/** AuthContext registers a callback so an expired/invalid session signs the user out everywhere. */
export function setUnauthorizedHandler(fn: (() => void) | null) {
  unauthorizedHandler = fn;
}

api.interceptors.response.use(
  res => res,
  error => {
    const url = String(error?.config?.url ?? '');
    // A 401 on /auth/* just means "wrong password"; anywhere else it means the session is no longer valid.
    if (error?.response?.status === 401 && !url.startsWith('/auth/')) {
      unauthorizedHandler?.();
    }
    return Promise.reject(error);
  },
);

export function isNetworkError(e: unknown): boolean {
  return axios.isAxiosError(e) && !e.response;
}

export function getErrorMessage(e: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const data = (e as { response?: { data?: { message?: string; fieldErrors?: Record<string, string> } } })?.response?.data;
  const fieldErrors = data?.fieldErrors ? Object.values(data.fieldErrors) : [];
  if (fieldErrors.length > 0) return fieldErrors[0];
  if (data?.message) return data.message;
  if (isNetworkError(e)) return 'Cannot reach the server. Check your connection and that the API is running.';
  return fallback;
}

export async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  const res = await api.post<{ url: string }>('/uploads', form, { timeout: 30000 });
  return res.data.url;
}
