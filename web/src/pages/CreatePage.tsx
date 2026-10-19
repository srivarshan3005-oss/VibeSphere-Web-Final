import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Banner from '../components/Banner';
import Button from '../components/Button';
import ImagePicker from '../components/ImagePicker';
import TextField from '../components/TextField';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { api, getErrorMessage, uploadImage, type Post } from '../lib/api';
import { emitPostEvent } from '../lib/events';
import { hasErrors, validatePost } from '../lib/validation';
import PageHeader from './PageHeader';

export default function CreatePage() {
  useDocumentTitle('New post');
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [errors, setErrors] = useState<{ caption?: string; image?: string }>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const errs = validatePost({ caption, hasImage: !!file });
    setErrors(errs);
    if (hasErrors(errs) || !file) return;
    setBusy(true);
    setError(null);
    try {
      const mediaUrl = await uploadImage(file);
      const res = await api.post<Post>('/posts', { caption: caption.trim(), mediaUrl, mediaType: 'IMAGE', visibility: 'PUBLIC' });
      emitPostEvent({ type: 'created', post: res.data });
      navigate('/');
    } catch (err) {
      setError(getErrorMessage(err, 'Could not publish your post.'));
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="New post" subtitle="Share a moment" />
      {error ? <Banner text={error} onDismiss={() => setError(null)} /> : null}
      <form className="card form-card" onSubmit={submit} noValidate>
        <ImagePicker file={file} onChange={setFile} error={errors.image} onError={m => setErrors(er => ({ ...er, image: m }))} />
        <TextField multiline label="Caption" value={caption} onChange={e => setCaption(e.target.value)} error={errors.caption} maxLength={2300} rows={4} placeholder="Write a caption…" />
        <Button type="submit" icon="send" loading={busy}>
          Publish
        </Button>
      </form>
    </>
  );
}
