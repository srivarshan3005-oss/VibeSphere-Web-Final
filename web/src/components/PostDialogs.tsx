import { useState } from 'react';
import Button from './Button';
import Dialog, { ConfirmDialog } from './Dialog';
import TextField from './TextField';
import { api, getErrorMessage, type Post } from '../lib/api';
import { emitPostEvent } from '../lib/events';

const REASONS = ['Spam', 'Harassment or bullying', 'Inappropriate content', 'Something else'];

export function DeletePostDialog({ post, onClose, onMessage }: { post: Post | null; onClose: () => void; onMessage: (m: string) => void }) {
  const [busy, setBusy] = useState(false);
  async function confirm() {
    if (!post || busy) return;
    setBusy(true);
    try {
      await api.delete(`/posts/${post.id}`);
      emitPostEvent({ type: 'deleted', id: post.id });
    } catch (e) {
      onMessage(getErrorMessage(e, 'Could not delete the post.'));
    } finally {
      setBusy(false);
      onClose();
    }
  }
  return (
    <ConfirmDialog
      open={!!post}
      destructive
      busy={busy}
      title="Delete this post?"
      message="This permanently removes the post, its likes and its comments."
      confirmLabel="Delete post"
      onConfirm={confirm}
      onCancel={onClose}
    />
  );
}

export function EditCaptionDialog({ post, onClose }: { post: Post | null; onClose: () => void }) {
  // Remount the form for each post so the draft always starts from the current caption.
  return (
    <Dialog open={!!post} title="Edit caption" onClose={onClose}>
      {post ? <EditCaptionForm key={post.id} post={post} onClose={onClose} /> : null}
    </Dialog>
  );
}

function EditCaptionForm({ post, onClose }: { post: Post; onClose: () => void }) {
  const [caption, setCaption] = useState(post.caption);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function save() {
    if (busy) return;
    if (caption.length > 2200) {
      setError('Captions can be at most 2200 characters.');
      return;
    }
    setBusy(true);
    setError(undefined);
    try {
      const res = await api.patch<Post>(`/posts/${post.id}`, { caption: caption.trim() });
      emitPostEvent({ type: 'updated', post: res.data });
      onClose();
    } catch (e) {
      setError(getErrorMessage(e, 'Could not save the caption.'));
      setBusy(false);
    }
  }

  return (
    <>
      <TextField multiline label="Caption" value={caption} onChange={e => setCaption(e.target.value)} error={error} maxLength={2300} rows={4} />
      <div className="dialog-actions">
        <Button variant="ghost" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button onClick={save} loading={busy}>
          Save caption
        </Button>
      </div>
    </>
  );
}

export function ReportPostDialog({ post, onClose, onMessage }: { post: Post | null; onClose: () => void; onMessage: (m: string) => void }) {
  return (
    <Dialog open={!!post} title="Report this post" onClose={onClose}>
      {post ? <ReportForm key={post.id} post={post} onClose={onClose} onMessage={onMessage} /> : null}
    </Dialog>
  );
}

function ReportForm({ post, onClose, onMessage }: { post: Post; onClose: () => void; onMessage: (m: string) => void }) {
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function send() {
    if (busy) return;
    setBusy(true);
    setError(undefined);
    try {
      await api.post('/safety/reports', { targetType: 'POST', targetId: post.id, reason, details: details.trim() || undefined });
      onMessage('Thanks. Your report was sent.');
      onClose();
    } catch (e) {
      setError(getErrorMessage(e, 'Could not send the report.'));
      setBusy(false);
    }
  }

  return (
    <>
      <fieldset className="radio-group">
        <legend>What is wrong with this post?</legend>
        {REASONS.map(r => (
          <label key={r} className="radio">
            <input type="radio" name="report-reason" checked={reason === r} onChange={() => setReason(r)} />
            <span>{r}</span>
          </label>
        ))}
      </fieldset>
      <TextField multiline label="Details (optional)" value={details} onChange={e => setDetails(e.target.value)} maxLength={1000} rows={3} error={error} />
      <div className="dialog-actions">
        <Button variant="ghost" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button variant="danger" onClick={send} loading={busy}>
          Send report
        </Button>
      </div>
    </>
  );
}
