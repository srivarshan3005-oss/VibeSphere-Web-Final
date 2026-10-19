import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Avatar from '../components/Avatar';
import Banner from '../components/Banner';
import Button from '../components/Button';
import TextField from '../components/TextField';
import { useAuth } from '../auth/authContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { ACCEPTED_IMAGE_TYPES } from '../lib/config';
import { api, getErrorMessage, uploadImage, type User } from '../lib/api';
import { validateImageFile } from '../lib/validation';
import PageHeader from './PageHeader';

export default function EditProfilePage() {
  useDocumentTitle('Edit profile');
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [avatarUrl, setAvatarUrl] = useState<string | null | undefined>(user?.avatarUrl);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || uploading) return;
    const problem = validateImageFile(file);
    if (problem) {
      setError(problem);
      return;
    }
    setUploading(true);
    setError(null);
    try {
      setAvatarUrl(await uploadImage(file));
    } catch (err) {
      setError(getErrorMessage(err, 'Could not upload that photo.'));
    } finally {
      setUploading(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    if (!displayName.trim() || displayName.trim().length > 80) {
      setNameError('Enter a display name (up to 80 characters).');
      return;
    }
    setNameError(undefined);
    setSaving(true);
    setError(null);
    try {
      const res = await api.put<User>('/users/me', { displayName: displayName.trim(), bio: bio.trim(), avatarUrl: avatarUrl ?? '' });
      updateUser(res.data);
      navigate('/profile');
    } catch (err) {
      setError(getErrorMessage(err, 'Could not save your profile.'));
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader title="Edit profile" back />
      {error ? <Banner text={error} onDismiss={() => setError(null)} /> : null}
      <form className="card form-card" onSubmit={save} noValidate>
        <div className="avatar-edit">
          <Avatar name={displayName || user?.displayName || '?'} uri={avatarUrl} size={96} />
          <div className="avatar-edit-actions">
            <Button variant="secondary" onClick={() => fileInput.current?.click()} loading={uploading}>
              {uploading ? 'Uploading…' : 'Change photo'}
            </Button>
            {avatarUrl ? (
              <button type="button" className="link-btn link-btn-danger" onClick={() => setAvatarUrl(null)}>
                Remove photo
              </button>
            ) : null}
          </div>
          <input ref={fileInput} className="visually-hidden" type="file" accept={ACCEPTED_IMAGE_TYPES.join(',')} onChange={e => void onPick(e)} aria-label="Choose a profile photo" tabIndex={-1} />
        </div>
        <TextField label="Display name" value={displayName} onChange={e => setDisplayName(e.target.value)} error={nameError} maxLength={80} />
        <TextField multiline label="Bio" value={bio} onChange={e => setBio(e.target.value)} maxLength={300} rows={4} hint={`${bio.length}/300`} />
        <div className="form-actions">
          <Button variant="ghost" onClick={() => navigate(-1)} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" loading={saving} disabled={uploading}>
            Save changes
          </Button>
        </div>
      </form>
    </>
  );
}
