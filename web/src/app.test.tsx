import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { fail, makePost, me, mockApi, ok, renderApp } from './test/helpers';

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
});

const myProfile = { id: 1, username: 'maya_1', displayName: 'Maya', bio: 'hello', avatarUrl: null, createdAt: new Date().toISOString(), postsCount: 0, followersCount: 0, followingCount: 0, followedByMe: false, isMe: true };
const signedIn = { 'GET /users/me': () => ok(me), 'GET /stories': () => ok([]) };

describe('authentication and protected routes', () => {
  it('sends a visitor without a session to the sign-in page', async () => {
    mockApi({ 'GET /users/me': () => fail(401, 'Please sign in') });
    renderApp('/');
    expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
  });

  it('guards every private route, not only the home page', async () => {
    mockApi({ 'GET /users/me': () => fail(401, 'Please sign in') });
    for (const path of ['/explore', '/create', '/profile', '/profile/edit', '/u/5', '/posts/1/comments']) {
      const { unmount } = renderApp(path);
      expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
      unmount();
    }
  });

  it('shows a retryable error when the API cannot be reached, then recovers', async () => {
    let up = false;
    mockApi({ 'GET /users/me': () => (up ? ok(me) : { network: true }), 'GET /posts': () => ok([]), 'GET /stories': () => ok([]) });
    renderApp('/');
    expect(await screen.findByText(/cannot reach the vibesphere server/i)).toBeInTheDocument();
    up = true;
    await userEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(await screen.findByRole('heading', { name: 'Home' })).toBeInTheDocument();
  });

  it('validates before calling the server', async () => {
    const calls = mockApi({ 'GET /users/me': () => fail(401, 'no') });
    renderApp('/login');
    await userEvent.click(await screen.findByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument();
    expect(screen.getByText('Enter your password.')).toBeInTheDocument();
    expect(calls.some(c => c.url === '/auth/login')).toBe(false);
  });

  it('shows the server message for wrong credentials and stays on the page', async () => {
    mockApi({ 'GET /users/me': () => fail(401, 'no'), 'POST /auth/login': () => fail(401, 'Invalid email or password') });
    renderApp('/login');
    await userEvent.type(await screen.findByLabelText('Email'), 'maya@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'wrongpass');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('Invalid email or password')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
  });

  it('signs in without storing a token and returns to the page the visitor wanted', async () => {
    let session = false;
    mockApi({
      'GET /users/me': () => (session ? ok(me) : fail(401, 'no')),
      'POST /auth/login': () => {
        session = true;
        return ok({ token: 'jwt-value', tokenType: 'Bearer', user: me });
      },
      'GET /stories': () => ok([]),
    });
    renderApp('/explore');
    await userEvent.type(await screen.findByLabelText('Email'), 'maya@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'longenough');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByRole('heading', { name: 'Explore' })).toBeInTheDocument();
    expect(JSON.stringify({ ...localStorage })).not.toContain('jwt-value');
  });

  it('registers a new account with the backend field names', async () => {
    let body: unknown;
    mockApi({
      'GET /users/me': () => fail(401, 'no'),
      'POST /auth/register': ({ data }) => {
        body = data;
        return ok({ token: 't', tokenType: 'Bearer', user: me }, 201);
      },
      'GET /posts': () => ok([]),
      'GET /stories': () => ok([]),
    });
    renderApp('/register');
    await userEvent.type(await screen.findByLabelText('Display name'), 'Maya');
    await userEvent.type(screen.getByLabelText('Username'), 'maya_1');
    await userEvent.type(screen.getByLabelText('Email'), 'maya@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'longenough');
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));
    await screen.findByRole('heading', { name: 'Home' });
    expect(body).toEqual({ username: 'maya_1', displayName: 'Maya', email: 'maya@example.com', password: 'longenough' });
  });

  it('signs out: asks the server to clear the cookie and returns to sign-in', async () => {
    let loggedOut = false;
    const calls = mockApi({ ...signedIn, 'GET /users/1': () => ok(myProfile), 'GET /users/1/posts': () => ok([]), 'POST /auth/logout': () => ((loggedOut = true), ok({})) });
    renderApp('/profile');
    await screen.findByRole('heading', { name: 'Maya' });
    await userEvent.click(screen.getAllByRole('button', { name: 'Sign out' })[0]);
    const dialog = await screen.findByRole('dialog', { name: 'Sign out?' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Sign out' }));
    expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
    await waitFor(() => expect(loggedOut).toBe(true));
    expect(calls.some(c => c.url === '/auth/logout')).toBe(true);
  });

  it('shows "session expired" when the server rejects an existing session', async () => {
    let expired = false;
    mockApi({ 'GET /users/me': () => ok(me), 'GET /stories': () => ok([]), 'GET /posts': () => (expired ? fail(401, 'expired') : ok([makePost()])) });
    renderApp('/');
    await screen.findByText('Sunset at the pier');
    expired = true;
    await userEvent.click(screen.getByRole('link', { name: 'Explore' }));
    mockApi({ 'GET /users/me': () => fail(401, 'expired'), 'GET /users/search': () => fail(401, 'expired') });
    await userEvent.type(await screen.findByLabelText('Search people'), 'sam');
    expect(await screen.findByText('Your session expired. Please sign in again.')).toBeInTheDocument();
  });
});

describe('home feed', () => {
  it('renders posts from the API with their author and counts', async () => {
    mockApi({ ...signedIn, 'GET /posts': () => ok([makePost({ id: 7, displayName: 'Sam', caption: 'Sunset at the pier', likesCount: 1500 })]) });
    renderApp('/');
    expect(await screen.findByText('Sunset at the pier')).toBeInTheDocument();
    expect(screen.getByText('Sam')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /like, 1500 likes/i })).toHaveTextContent('1.5K');
  });

  it('asks the API for paged results', async () => {
    const calls = mockApi({ ...signedIn, 'GET /posts': () => ok([]) });
    renderApp('/');
    await screen.findByText('No posts yet');
    expect(calls.find(c => c.url === '/posts')?.params).toEqual({ page: 0, size: 10 });
  });

  it('likes optimistically and keeps the server count', async () => {
    mockApi({ ...signedIn, 'GET /posts': () => ok([makePost({ id: 9 })]), 'POST /posts/9/like': () => ok({ likedByMe: true, likesCount: 4 }) });
    renderApp('/');
    await userEvent.click(await screen.findByRole('button', { name: /^like, 3 likes/i }));
    expect(await screen.findByRole('button', { name: /unlike, 4 likes/i })).toHaveAttribute('aria-pressed', 'true');
  });

  it('rolls a like back and explains when the request fails', async () => {
    mockApi({ ...signedIn, 'GET /posts': () => ok([makePost({ id: 9 })]), 'POST /posts/9/like': () => fail(404, 'Post not found') });
    renderApp('/');
    await userEvent.click(await screen.findByRole('button', { name: /^like, 3 likes/i }));
    expect(await screen.findByText('Post not found')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^like, 3 likes/i })).toHaveAttribute('aria-pressed', 'false');
  });

  it('shows an empty state with a way to create the first post', async () => {
    mockApi({ ...signedIn, 'GET /posts': () => ok([]) });
    renderApp('/');
    expect(await screen.findByText('No posts yet')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Create a post' })).toHaveAttribute('href', '/create');
  });

  it('shows an error with a retry that works', async () => {
    let attempt = 0;
    mockApi({ ...signedIn, 'GET /posts': () => (++attempt === 1 ? { network: true } : ok([makePost()])) });
    renderApp('/');
    expect(await screen.findByText(/cannot reach the server/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(await screen.findByText('Sunset at the pier')).toBeInTheDocument();
  });

  it('loads the next page and does not duplicate posts', async () => {
    const page0 = Array.from({ length: 10 }, (_, i) => makePost({ id: 100 - i, caption: `post ${100 - i}` }));
    const page1 = [makePost({ id: 90, caption: 'post 90' }), makePost({ id: 100, caption: 'post 100' })];
    mockApi({ ...signedIn, 'GET /posts': ({ params }) => ok(params?.page === 0 ? page0 : page1) });
    renderApp('/');
    await screen.findByText('post 100');
    await userEvent.click(screen.getByRole('button', { name: 'Load more' }));
    expect(await screen.findByText('post 90')).toBeInTheDocument();
    expect(screen.getAllByText('post 100')).toHaveLength(1);
  });

  it('offers edit and delete on your own posts and report on others', async () => {
    mockApi({ ...signedIn, 'GET /posts': () => ok([makePost({ id: 1, userId: 1, username: 'maya_1', displayName: 'Maya', caption: 'mine' }), makePost({ id: 2, caption: 'theirs' })]) });
    renderApp('/');
    await userEvent.click(await screen.findByRole('button', { name: 'Post options' }));
    expect(screen.getByRole('menuitem', { name: 'Edit caption' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Delete post' })).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    await userEvent.click(screen.getByRole('button', { name: 'Report options' }));
    expect(screen.getByRole('menuitem', { name: 'Report post' })).toBeInTheDocument();
  });

  it('deletes your own post after confirmation', async () => {
    const calls = mockApi({ ...signedIn, 'GET /posts': () => ok([makePost({ id: 5, userId: 1, displayName: 'Maya', caption: 'mine' })]), 'DELETE /posts/5': () => ok({ deleted: true, id: 5 }) });
    renderApp('/');
    await userEvent.click(await screen.findByRole('button', { name: 'Post options' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Delete post' }));
    const dialog = await screen.findByRole('dialog', { name: 'Delete this post?' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete post' }));
    await waitFor(() => expect(screen.queryByText('mine')).not.toBeInTheDocument());
    expect(calls.some(c => c.method === 'DELETE' && c.url === '/posts/5')).toBe(true);
  });

  it('edits a caption through PATCH', async () => {
    mockApi({
      ...signedIn,
      'GET /posts': () => ok([makePost({ id: 5, userId: 1, displayName: 'Maya', caption: 'old' })]),
      'PATCH /posts/5': ({ data }) => ok(makePost({ id: 5, userId: 1, displayName: 'Maya', caption: (data as { caption: string }).caption })),
    });
    renderApp('/');
    await userEvent.click(await screen.findByRole('button', { name: 'Post options' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Edit caption' }));
    const box = await screen.findByLabelText('Caption');
    await userEvent.clear(box);
    await userEvent.type(box, 'brand new');
    await userEvent.click(screen.getByRole('button', { name: 'Save caption' }));
    expect(await screen.findByText('brand new')).toBeInTheDocument();
  });

  it('reports a post with the chosen reason', async () => {
    let body: unknown;
    mockApi({ ...signedIn, 'GET /posts': () => ok([makePost({ id: 2 })]), 'POST /safety/reports': ({ data }) => ((body = data), ok({ id: 1 }, 201)) });
    renderApp('/');
    await userEvent.click(await screen.findByRole('button', { name: 'Report options' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Report post' }));
    await userEvent.click(await screen.findByRole('radio', { name: 'Spam' }));
    await userEvent.click(screen.getByRole('button', { name: 'Send report' }));
    expect(await screen.findByText('Thanks. Your report was sent.')).toBeInTheDocument();
    expect(body).toMatchObject({ targetType: 'POST', targetId: 2, reason: 'Spam' });
  });
});

describe('stories', () => {
  it('shows real stories grouped by author and opens the viewer', async () => {
    mockApi({
      'GET /users/me': () => ok(me),
      'GET /posts': () => ok([]),
      'GET /stories': () => ok([{ id: 1, userId: 2, username: 'sam', displayName: 'Sam', caption: 'beach day', mediaUrl: '/api/uploads/s.jpg', createdAt: new Date().toISOString(), expiresAt: new Date().toISOString() }]),
    });
    renderApp('/');
    await userEvent.click(await screen.findByRole('button', { name: /view sam’s story/i }));
    expect(await screen.findByText('beach day')).toBeInTheDocument();
  });

  it('hides nothing silently when stories fail to load', async () => {
    mockApi({ 'GET /users/me': () => ok(me), 'GET /posts': () => ok([]), 'GET /stories': () => fail(500, 'boom') });
    renderApp('/');
    expect(await screen.findByText('Stories could not be loaded right now.')).toBeInTheDocument();
  });
});

describe('creating a post', () => {
  it('requires a photo', async () => {
    mockApi({ ...signedIn });
    renderApp('/create');
    await userEvent.click(await screen.findByRole('button', { name: 'Publish' }));
    expect(await screen.findByText('Choose a photo to share.')).toBeInTheDocument();
  });

  it('rejects unsupported file types on the client', async () => {
    mockApi({ ...signedIn });
    renderApp('/create');
    const input = (await screen.findByLabelText(/choose a photo/i, { selector: 'input' })) as HTMLInputElement;
    await userEvent.upload(input, new File(['x'], 'a.gif', { type: 'image/gif' }), { applyAccept: false });
    expect(await screen.findByText('Use a JPEG, PNG or WebP image.')).toBeInTheDocument();
  });

  it('uploads the image, then creates the post and shows it on the home feed', async () => {
    const created = makePost({ id: 77, userId: 1, displayName: 'Maya', username: 'maya_1', caption: 'hello world', mediaUrl: '/api/uploads/new.png' });
    const calls = mockApi({
      ...signedIn,
      'POST /uploads': () => ok({ url: '/api/uploads/new.png' }, 201),
      'POST /posts': () => ok(created, 201),
      'GET /posts': () => ok([]),
    });
    renderApp('/create');
    const input = (await screen.findByLabelText(/choose a photo/i, { selector: 'input' })) as HTMLInputElement;
    await userEvent.upload(input, new File(['png-bytes'], 'a.png', { type: 'image/png' }));
    await userEvent.type(screen.getByLabelText('Caption'), 'hello world');
    await userEvent.click(screen.getByRole('button', { name: 'Publish' }));
    expect(await screen.findByRole('heading', { name: 'Home' })).toBeInTheDocument();
    const order = calls.filter(c => c.url === '/uploads' || c.url === '/posts' && c.method === 'POST').map(c => c.url);
    expect(order).toEqual(['/uploads', '/posts']);
    const postCall = calls.find(c => c.method === 'POST' && c.url === '/posts');
    expect(postCall?.data).toMatchObject({ caption: 'hello world', mediaUrl: '/api/uploads/new.png', mediaType: 'IMAGE', visibility: 'PUBLIC' });
  });

  it('shows the server error and keeps the form when publishing fails', async () => {
    mockApi({ ...signedIn, 'POST /uploads': () => fail(415, 'Only JPEG, PNG or WebP images are allowed') });
    renderApp('/create');
    const input = (await screen.findByLabelText(/choose a photo/i, { selector: 'input' })) as HTMLInputElement;
    await userEvent.upload(input, new File(['x'], 'a.png', { type: 'image/png' }));
    await userEvent.click(screen.getByRole('button', { name: 'Publish' }));
    expect(await screen.findByText('Only JPEG, PNG or WebP images are allowed')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Publish' })).toBeEnabled();
  });
});

describe('comments and replies', () => {
  const comment = (over = {}) => ({ id: 1, postId: 4, parentId: null, userId: 2, username: 'sam', displayName: 'Sam', avatarUrl: null, body: 'Nice shot', createdAt: new Date().toISOString(), ...over });

  it('lists comments with replies under their parent', async () => {
    mockApi({ ...signedIn, 'GET /posts/4/comments': () => ok([comment(), comment({ id: 2, parentId: 1, body: 'Thanks!' })]) });
    renderApp('/posts/4/comments');
    const items = within(await screen.findByRole('list', { name: 'Comments' })).getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('Nice shot');
    expect(items[1]).toHaveTextContent('Thanks!');
  });

  it('posts a reply with the parent id', async () => {
    let body: unknown;
    mockApi({
      ...signedIn,
      'GET /posts/4/comments': () => ok([comment()]),
      'POST /posts/4/comments': ({ data }) => ((body = data), ok(comment({ id: 3, parentId: 1, userId: 1, username: 'maya_1', body: 'agreed' }), 201)),
    });
    renderApp('/posts/4/comments');
    await userEvent.click(await screen.findByRole('button', { name: 'Reply to sam' }));
    await userEvent.type(screen.getByLabelText('Write a comment'), 'agreed');
    await userEvent.click(screen.getByRole('button', { name: 'Send comment' }));
    expect(await screen.findByText('agreed')).toBeInTheDocument();
    expect(body).toEqual({ body: 'agreed', parentId: 1 });
  });

  it('lets you delete only your own comments', async () => {
    mockApi({ ...signedIn, 'GET /posts/4/comments': () => ok([comment(), comment({ id: 2, userId: 1, username: 'maya_1', displayName: 'Maya', body: 'mine' })]), 'DELETE /posts/4/comments/2': () => ok({ deleted: true }) });
    renderApp('/posts/4/comments');
    await screen.findByText('mine');
    expect(screen.getAllByRole('button', { name: /^delete comment by/i })).toHaveLength(1);
    await userEvent.click(screen.getByRole('button', { name: 'Delete comment by maya_1' }));
    const dialog = await screen.findByRole('dialog', { name: 'Delete comment?' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete comment' }));
    await waitFor(() => expect(screen.queryByText('mine')).not.toBeInTheDocument());
  });

  it('shows an empty state and handles a hidden/missing post', async () => {
    mockApi({ ...signedIn, 'GET /posts/4/comments': () => ok([]), 'GET /posts/8/comments': () => fail(404, 'Post not found') });
    const { unmount } = renderApp('/posts/4/comments');
    expect(await screen.findByText('No comments yet')).toBeInTheDocument();
    unmount();
    renderApp('/posts/8/comments');
    expect(await screen.findByText('Post not found')).toBeInTheDocument();
  });

  it('treats a non-numeric post id as not found', async () => {
    mockApi({ ...signedIn });
    renderApp('/posts/abc/comments');
    expect(await screen.findByText('Page not found')).toBeInTheDocument();
  });
});

describe('profiles, follow and edit', () => {
  const profile = { id: 2, username: 'sam', displayName: 'Sam', bio: 'photographer', avatarUrl: null, createdAt: new Date().toISOString(), postsCount: 3, followersCount: 10, followingCount: 4, followedByMe: false, isMe: false };

  it('follows and unfollows with the server count', async () => {
    mockApi({ ...signedIn, 'GET /users/2': () => ok(profile), 'GET /users/2/posts': () => ok([]), 'POST /users/2/follow': () => ok({ following: true, userId: 2, followersCount: 11 }) });
    renderApp('/u/2');
    await userEvent.click(await screen.findByRole('button', { name: 'Follow' }));
    expect(await screen.findByRole('button', { name: 'Following' })).toBeInTheDocument();
    expect(screen.getByLabelText('11 Followers')).toBeInTheDocument();
  });

  it('rolls a follow back when the server refuses', async () => {
    mockApi({ ...signedIn, 'GET /users/2': () => ok(profile), 'GET /users/2/posts': () => ok([]), 'POST /users/2/follow': () => fail(500, 'Could not follow') });
    renderApp('/u/2');
    await userEvent.click(await screen.findByRole('button', { name: 'Follow' }));
    expect(await screen.findByText('Could not follow')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Follow' })).toBeInTheDocument();
  });

  it('redirects your own id to /profile and treats bad ids as not found', async () => {
    mockApi({ ...signedIn, 'GET /users/1': () => ok({ ...profile, id: 1, username: 'maya_1', displayName: 'Maya', isMe: true }), 'GET /users/1/posts': () => ok([]) });
    const { unmount } = renderApp('/u/1');
    expect(await screen.findByRole('link', { name: 'Edit profile' })).toBeInTheDocument();
    unmount();
    renderApp('/u/abc');
    expect(await screen.findByText('Page not found')).toBeInTheDocument();
  });

  it('shows an error with retry when a profile does not exist', async () => {
    mockApi({ ...signedIn, 'GET /users/9': () => fail(404, 'User not found'), 'GET /users/9/posts': () => fail(404, 'User not found') });
    renderApp('/u/9');
    expect(await screen.findByText('User not found')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('saves profile edits with PUT /users/me', async () => {
    let body: unknown;
    mockApi({
      ...signedIn,
      'GET /users/1': () => ok({ ...profile, id: 1, username: 'maya_1', displayName: 'Maya New', isMe: true }),
      'GET /users/1/posts': () => ok([]),
      'PUT /users/me': ({ data }) => ((body = data), ok({ ...me, displayName: 'Maya New', bio: 'new bio' })),
    });
    renderApp('/profile/edit');
    const name = await screen.findByLabelText('Display name');
    await userEvent.clear(name);
    await userEvent.type(name, 'Maya New');
    await userEvent.clear(screen.getByLabelText('Bio'));
    await userEvent.type(screen.getByLabelText('Bio'), 'new bio');
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByRole('heading', { name: 'Maya New' })).toBeInTheDocument();
    expect(body).toEqual({ displayName: 'Maya New', bio: 'new bio', avatarUrl: '' });
  });

  it('requires a display name when editing', async () => {
    const calls = mockApi({ ...signedIn });
    renderApp('/profile/edit');
    await userEvent.clear(await screen.findByLabelText('Display name'));
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByText('Enter a display name (up to 80 characters).')).toBeInTheDocument();
    expect(calls.some(c => c.method === 'PUT')).toBe(false);
  });
});

describe('search', () => {
  it('waits for two characters, then searches and links to profiles', async () => {
    const calls = mockApi({ ...signedIn, 'GET /users/search': () => ok([{ id: 2, username: 'sam', displayName: 'Sam', bio: null, avatarUrl: null }]) });
    renderApp('/explore');
    const box = await screen.findByLabelText('Search people');
    await userEvent.type(box, 's');
    expect(calls.some(c => c.url === '/users/search')).toBe(false);
    await userEvent.type(box, 'a');
    const link = await screen.findByRole('link', { name: /sam/i }, { timeout: 3000 });
    expect(link).toHaveAttribute('href', '/u/2');
    expect(calls.find(c => c.url === '/users/search')?.params).toEqual({ q: 'sa' });
  });

  it('shows an empty result message', async () => {
    mockApi({ ...signedIn, 'GET /users/search': () => ok([]) });
    renderApp('/explore');
    await userEvent.type(await screen.findByLabelText('Search people'), 'zzz');
    expect(await screen.findByText('No matches', undefined, { timeout: 3000 })).toBeInTheDocument();
  });
});

describe('themes', () => {
  it('switches between light and dark and remembers the choice', async () => {
    mockApi({ ...signedIn, 'GET /users/1': () => ok(myProfile), 'GET /users/1/posts': () => ok([]) });
    renderApp('/profile');
    await screen.findByRole('heading', { name: 'Maya' });
    const group = screen.getAllByRole('radiogroup', { name: 'Theme' })[0];
    await userEvent.click(within(group).getByRole('radio', { name: 'Dark' }));
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('vibesphere.themeMode')).toBe('dark');
    await userEvent.click(within(group).getByRole('radio', { name: 'Light' }));
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    await userEvent.click(within(group).getByRole('radio', { name: 'System' }));
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });
});

describe('navigation', () => {
  it('shows a not-found page for unknown routes inside the app', async () => {
    mockApi({ ...signedIn });
    renderApp('/definitely-not-a-page');
    expect(await screen.findByText('Page not found')).toBeInTheDocument();
  });

  it('exposes the four main destinations', async () => {
    mockApi({ ...signedIn, 'GET /posts': () => ok([]) });
    renderApp('/');
    const nav = await screen.findByRole('navigation', { name: 'Main' });
    for (const name of ['Home', 'Explore', 'Create', 'Profile']) expect(within(nav).getByRole('link', { name })).toBeInTheDocument();
  });
});
