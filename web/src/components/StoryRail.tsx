import { useEffect, useMemo, useState } from 'react';
import Avatar from './Avatar';
import Button from './Button';
import Dialog from './Dialog';
import Icon from './Icon';
import ImagePicker from './ImagePicker';
import TextField from './TextField';
import { api, getErrorMessage, uploadImage, type Story } from '../lib/api';
import { resolveMediaUrl } from '../lib/config';
import { timeAgo } from '../lib/format';
import { groupStories, type StoryGroup as Group } from '../lib/stories';

export default function StoryRail({ myId }: { myId?: number }) {
  const [stories, setStories] = useState<Story[]>([]);
  const [failed, setFailed] = useState(false);
  const [viewing, setViewing] = useState<Group | null>(null);
  const [adding, setAdding] = useState(false);
  const groups = useMemo(() => groupStories(stories, myId), [stories, myId]);

  useEffect(() => {
    let alive = true;
    api
      .get<Story[]>('/stories')
      .then(r => alive && setStories(r.data))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <section className="stories" aria-label="Stories">
      <ul className="stories-list">
        <li>
          <button type="button" className="story story-add" onClick={() => setAdding(true)}>
            <span className="story-ring story-ring-add">
              <Icon name="plus" size={26} />
            </span>
            <span className="story-label">Add story</span>
          </button>
        </li>
        {groups.map(g => (
          <li key={g.userId}>
            <button type="button" className="story" onClick={() => setViewing(g)} aria-label={`View ${g.displayName}’s story`}>
              <span className="story-ring">
                <Avatar name={g.displayName} size={54} />
              </span>
              <span className="story-label">{g.userId === myId ? 'Your story' : g.username}</span>
            </button>
          </li>
        ))}
      </ul>
      {failed ? <p className="stories-note">Stories could not be loaded right now.</p> : null}

      <StoryViewer group={viewing} onClose={() => setViewing(null)} />
      <AddStoryDialog
        open={adding}
        onClose={() => setAdding(false)}
        onCreated={s => {
          setStories(prev => [s, ...prev]);
          setAdding(false);
        }}
      />
    </section>
  );
}

function StoryViewer({ group, onClose }: { group: Group | null; onClose: () => void }) {
  return (
    <Dialog open={!!group} title={group ? `${group.displayName}’s story` : 'Story'} onClose={onClose} wide>
      {group ? <StoryViewerBody key={group.userId} group={group} onClose={onClose} /> : null}
    </Dialog>
  );
}

function StoryViewerBody({ group, onClose }: { group: Group; onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const story = group.stories[index];
  const src = resolveMediaUrl(story.mediaUrl);
  return (
    <div className="story-view">
      <p className="story-view-meta">
        @{group.username} · {timeAgo(story.createdAt)} · {index + 1} of {group.stories.length}
      </p>
      {src ? <img className="story-view-img" src={src} alt={story.caption || `Story by ${group.displayName}`} /> : null}
      {story.caption ? <p className="story-view-caption">{story.caption}</p> : null}
      <div className="dialog-actions">
        <Button variant="ghost" icon="chevronLeft" disabled={index === 0} onClick={() => setIndex(i => i - 1)}>
          Previous
        </Button>
        {index < group.stories.length - 1 ? (
          <Button variant="secondary" icon="chevronRight" onClick={() => setIndex(i => i + 1)}>
            Next
          </Button>
        ) : (
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        )}
      </div>
    </div>
  );
}

function AddStoryDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (s: Story) => void }) {
  return (
    <Dialog open={open} title="Add to your story" onClose={onClose} closeOnBackdrop={false}>
      {open ? <AddStoryForm onClose={onClose} onCreated={onCreated} /> : null}
    </Dialog>
  );
}

function AddStoryForm({ onClose, onCreated }: { onClose: () => void; onCreated: (s: Story) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [imageError, setImageError] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  async function share() {
    if (busy) return;
    if (!file) {
      setImageError('Choose a photo to share.');
      return;
    }
    setBusy(true);
    setError(undefined);
    try {
      const mediaUrl = await uploadImage(file);
      const res = await api.post<Story>('/stories', { caption: caption.trim() || undefined, mediaUrl });
      onCreated(res.data);
    } catch (e) {
      setError(getErrorMessage(e, 'Could not share your story.'));
      setBusy(false);
    }
  }

  return (
    <>
      <ImagePicker file={file} onChange={setFile} error={imageError} onError={setImageError} shape="story" />
      <TextField label="Caption (optional)" value={caption} onChange={e => setCaption(e.target.value)} maxLength={500} />
      {error ? (
        <p className="field-msg" role="alert">
          {error}
        </p>
      ) : null}
      <p className="dialog-note">Stories disappear after 24 hours.</p>
      <div className="dialog-actions">
        <Button variant="ghost" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button onClick={share} loading={busy}>
          Share story
        </Button>
      </div>
    </>
  );
}
