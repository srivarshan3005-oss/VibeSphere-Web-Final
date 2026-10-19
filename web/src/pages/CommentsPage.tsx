import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import Avatar from '../components/Avatar';
import Banner from '../components/Banner';
import Button from '../components/Button';
import CommentItem from '../components/CommentItem';
import { ConfirmDialog } from '../components/Dialog';
import Icon from '../components/Icon';
import { EmptyState, ErrorState, LoadingState } from '../components/States';
import { useAuth } from '../auth/authContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { api, getErrorMessage, type Post, type PostComment } from '../lib/api';
import { resolveMediaUrl } from '../lib/config';
import { emitPostEvent } from '../lib/events';
import PageHeader from './PageHeader';
import NotFoundPage from './NotFoundPage';

const SIZE = 50;

export default function CommentsPage() {
  const params = useParams();
  const postId = Number(params.postId);
  if (!Number.isInteger(postId) || postId <= 0) return <NotFoundPage />;
  return <Comments key={postId} postId={postId} />;
}

function PostSummary({ post }: { post: Post }) {
  const src = resolveMediaUrl(post.mediaUrl);
  return (
    <div className="card summary">
      {src ? <img className="summary-img" src={src} alt="" /> : null}
      <div className="summary-text">
        <p className="summary-author">
          <Avatar name={post.displayName} uri={post.avatarUrl} size={28} /> <span>@{post.username}</span>
        </p>
        {post.caption ? <p className="summary-caption">{post.caption}</p> : null}
      </div>
    </div>
  );
}

function Comments({ postId }: { postId: number }) {
  useDocumentTitle('Comments');
  const { user } = useAuth();
  const location = useLocation();
  const post = (location.state as { post?: Post } | null)?.post;

  const [comments, setComments] = useState<PostComment[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<PostComment | null>(null);
  const [sending, setSending] = useState(false);
  const [toDelete, setToDelete] = useState<PostComment | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const page = useRef(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const res = await api.get<PostComment[]>(`/posts/${postId}/comments`, { params: { page: 0, size: SIZE } });
      setComments(res.data);
      page.current = 1;
      setHasMore(res.data.length >= SIZE);
      setStatus('ready');
    } catch (e) {
      setError(getErrorMessage(e, 'Could not load comments.'));
      setStatus('error');
    }
  }, [postId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function loadMore() {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await api.get<PostComment[]>(`/posts/${postId}/comments`, { params: { page: page.current, size: SIZE } });
      setComments(prev => {
        const seen = new Set(prev.map(c => c.id));
        return [...prev, ...res.data.filter(c => !seen.has(c.id))];
      });
      page.current += 1;
      setHasMore(res.data.length >= SIZE);
    } catch (e) {
      setNotice(getErrorMessage(e, 'Could not load more comments.'));
    } finally {
      setLoadingMore(false);
    }
  }

  // Top-level comments, each followed by its replies.
  const ordered = useMemo(() => {
    const top = comments.filter(c => c.parentId === null);
    const replies = comments.filter(c => c.parentId !== null);
    return top.flatMap(t => [t, ...replies.filter(r => r.parentId === t.id)]);
  }, [comments]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const res = await api.post<PostComment>(`/posts/${postId}/comments`, { body, parentId: replyTo?.id ?? null });
      setComments(prev => [...prev, res.data]);
      emitPostEvent({ type: 'commentsDelta', id: postId, delta: 1 });
      setText('');
      setReplyTo(null);
    } catch (err) {
      setNotice(getErrorMessage(err, 'Could not post your comment.'));
    } finally {
      setSending(false);
    }
  }

  async function confirmDelete() {
    if (!toDelete || deleting) return;
    setDeleting(true);
    try {
      await api.delete(`/posts/${postId}/comments/${toDelete.id}`);
      const removed = comments.filter(c => c.id === toDelete.id || c.parentId === toDelete.id).length;
      setComments(prev => prev.filter(c => c.id !== toDelete.id && c.parentId !== toDelete.id));
      emitPostEvent({ type: 'commentsDelta', id: postId, delta: -removed });
    } catch (err) {
      setNotice(getErrorMessage(err, 'Could not delete the comment.'));
    } finally {
      setDeleting(false);
      setToDelete(null);
    }
  }

  const profilePath = (id: number) => (id === user?.id ? '/profile' : `/u/${id}`);
  const onReply = useCallback((c: PostComment) => {
    setReplyTo(c);
    inputRef.current?.focus();
  }, []);
  const onDelete = useCallback((c: PostComment) => setToDelete(c), []);

  return (
    <>
      <PageHeader title="Comments" back />
      {post ? <PostSummary post={post} /> : null}
      {notice ? <Banner text={notice} onDismiss={() => setNotice(null)} /> : null}

      {status === 'loading' ? (
        <LoadingState message="Loading comments…" />
      ) : status === 'error' ? (
        <ErrorState message={error} onRetry={() => void load()} />
      ) : ordered.length === 0 ? (
        <EmptyState icon="comment" title="No comments yet" message="Start the conversation." />
      ) : (
        <>
          <ul className="comments" aria-label="Comments">
            {ordered.map(c => (
              <CommentItem key={c.id} comment={c} canDelete={c.userId === user?.id} profilePath={profilePath(c.userId)} onReply={onReply} onDelete={onDelete} />
            ))}
          </ul>
          {hasMore ? (
            <div className="load-more">
              <Button variant="secondary" onClick={() => void loadMore()} loading={loadingMore}>
                Load more comments
              </Button>
            </div>
          ) : null}
        </>
      )}

      <form className="composer" onSubmit={send}>
        {replyTo ? (
          <div className="composer-reply">
            <span>Replying to @{replyTo.username}</span>
            <button type="button" className="icon-btn icon-btn-sm" onClick={() => setReplyTo(null)} aria-label="Cancel reply">
              <Icon name="close" size={16} />
            </button>
          </div>
        ) : null}
        <div className="composer-row">
          <label htmlFor="comment-input" className="visually-hidden">
            Write a comment
          </label>
          <textarea
            id="comment-input"
            ref={inputRef}
            className="input textarea composer-input"
            rows={1}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
            placeholder="Add a comment…"
            maxLength={1000}
          />
          <Button type="submit" icon="send" loading={sending} disabled={!text.trim()} aria-label="Send comment">
            Send
          </Button>
        </div>
        <p className="composer-hint">Press Enter to send, Shift+Enter for a new line.</p>
      </form>
      <p className="back-link">
        <Link to="/">Back to Home</Link>
      </p>

      <ConfirmDialog
        open={!!toDelete}
        destructive
        busy={deleting}
        title="Delete comment?"
        message={toDelete && ordered.some(c => c.parentId === toDelete.id) ? 'Its replies will be deleted too.' : 'This cannot be undone.'}
        confirmLabel="Delete comment"
        onConfirm={() => void confirmDelete()}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}
