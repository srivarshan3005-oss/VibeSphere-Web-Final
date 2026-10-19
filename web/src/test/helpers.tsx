import { render } from '@testing-library/react';
import { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import AuthProvider from '../auth/AuthProvider';
import { api, type Post, type User } from '../lib/api';
import ThemeProvider from '../theme/ThemeProvider';

export type MockResult = { status: number; data?: unknown } | { network: true };
export type Handler = (req: { data: unknown; params: Record<string, unknown> | undefined; config: InternalAxiosRequestConfig }) => MockResult | Promise<MockResult>;
export type Call = { method: string; url: string; data: unknown; params?: Record<string, unknown> };

/**
 * Replaces axios' network layer with an in-memory table keyed by "METHOD /path". The app code, interceptors and error
 * handling all run for real; only the HTTP transport is faked, so these tests prove front-end logic, not the live server.
 */
export function mockApi(routes: Record<string, Handler>) {
  const calls: Call[] = [];
  api.defaults.adapter = async config => {
    const method = (config.method ?? 'get').toUpperCase();
    const url = config.url ?? '';
    let data: unknown = config.data;
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch {
        /* keep raw string */
      }
    }
    calls.push({ method, url, data, params: config.params });
    const handler = routes[`${method} ${url}`];
    const out: MockResult = handler ? await handler({ data, params: config.params, config }) : { status: 404, data: { message: `No mock for ${method} ${url}` } };
    if ('network' in out) throw new AxiosError('Network Error', 'ERR_NETWORK', config);
    const response = { data: out.data, status: out.status, statusText: '', headers: {}, config, request: {} };
    if (out.status >= 200 && out.status < 300) return response;
    throw new AxiosError(`Request failed with status code ${out.status}`, 'ERR_BAD_REQUEST', config, {}, response);
  };
  return calls;
}

export const ok = (data: unknown, status = 200): MockResult => ({ status, data });
export const fail = (status: number, message: string): MockResult => ({ status, data: { status, message } });

export const me: User = { id: 1, username: 'maya_1', displayName: 'Maya', email: 'maya@example.com', bio: 'hello', avatarUrl: null };

export function makePost(over: Partial<Post> = {}): Post {
  return {
    id: 1,
    userId: 2,
    username: 'sam',
    displayName: 'Sam',
    avatarUrl: null,
    caption: 'Sunset at the pier',
    mediaUrl: '/api/uploads/a.jpg',
    mediaType: 'IMAGE',
    visibility: 'PUBLIC',
    createdAt: new Date().toISOString(),
    likesCount: 3,
    commentsCount: 1,
    likedByMe: false,
    ...over,
  };
}

export function renderApp(path = '/') {
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[path]}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>
    </ThemeProvider>,
  );
}
