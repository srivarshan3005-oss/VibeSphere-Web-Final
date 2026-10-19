import { AxiosError } from 'axios';
import { describe, expect, it, vi } from 'vitest';
import { api, getErrorMessage, isNetworkError, setUnauthorizedHandler } from './api';
import { fail, mockApi, ok } from '../test/helpers';

describe('api client', () => {
  it('sends the session cookie and the CSRF header on every request', () => {
    expect(api.defaults.withCredentials).toBe(true);
    expect(api.defaults.headers['X-Requested-With']).toBe('XMLHttpRequest');
  });

  it('does not keep any token in browser storage', async () => {
    mockApi({ 'POST /auth/login': () => ok({ token: 'secret-jwt', user: { id: 1 } }) });
    await api.post('/auth/login', { email: 'a@b.co', password: 'x' });
    expect(JSON.stringify({ ...localStorage })).not.toContain('secret-jwt');
    expect(JSON.stringify({ ...sessionStorage })).not.toContain('secret-jwt');
  });

  it('signs out on a 401 from a normal endpoint but not from /auth/*', async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    mockApi({ 'GET /posts': () => fail(401, 'expired'), 'POST /auth/login': () => fail(401, 'Invalid email or password') });
    await expect(api.get('/posts')).rejects.toBeInstanceOf(AxiosError);
    expect(handler).toHaveBeenCalledTimes(1);
    await expect(api.post('/auth/login', {})).rejects.toBeInstanceOf(AxiosError);
    expect(handler).toHaveBeenCalledTimes(1);
    setUnauthorizedHandler(null);
  });
});

describe('getErrorMessage', () => {
  it('prefers field errors, then the server message', async () => {
    mockApi({ 'GET /a': () => ({ status: 400, data: { message: 'Validation failed', fieldErrors: { email: 'must be a well-formed email address' } } }), 'GET /b': () => fail(409, 'Email is already registered') });
    expect(getErrorMessage(await api.get('/a').catch(e => e))).toBe('must be a well-formed email address');
    expect(getErrorMessage(await api.get('/b').catch(e => e))).toBe('Email is already registered');
  });
  it('explains a network failure and falls back otherwise', async () => {
    mockApi({ 'GET /a': () => ({ network: true }) });
    const e = await api.get('/a').catch(err => err);
    expect(isNetworkError(e)).toBe(true);
    expect(getErrorMessage(e)).toMatch(/cannot reach the server/i);
    expect(getErrorMessage(new Error('x'), 'Fallback')).toBe('Fallback');
  });
});
