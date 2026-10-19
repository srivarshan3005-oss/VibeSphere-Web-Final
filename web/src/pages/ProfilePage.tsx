import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import Avatar from '../components/Avatar';
import Banner from '../components/Banner';
import Button from '../components/Button';
import { ConfirmDialog } from '../components/Dialog';
import PostFeed from '../components/PostFeed';
import { EmptyState, ErrorState, LoadingState } from '../components/States';
import ThemeSwitch from '../components/ThemeSwitch';
import { useAuth } from '../auth/authContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { usePagedPosts } from '../hooks/usePagedPosts';
import { api, getErrorMessage, type Post, type Profile } from '../lib/api';
import { compact } from '../lib/format';
import NotFoundPage from './NotFoundPage';
import PageHeader from './PageHeader';

/** /profile: the signed-in user's own profile. */
export function MyProfilePage() {
  const { user } = useAuth();
  return user ? <ProfileView key={user.id} userId={user.id} /> : null;
}

/** /u/:userId: someone else's profile (your own id redirects to /profile). */
export function UserProfilePage() {
  const { user } = useAuth();
  const raw = useParams().userId ?? '';
  const id = Number(raw);
  if (!/^\d+$/.test(raw) || !Number.isSafeInteger(id) || id <= 0) return <NotFoundPage />;
  if (id === user?.id) return <Navigate to="/profile" replace />;
  return <ProfileView key={id} userId={id} />;
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="stat" aria-label={`${value} ${label}`}>
      <span className="stat-num">{compact(value)}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

function ProfileView({ userId }: { userId: number }) {
  const { user, signOut } = useAuth();
  const isMe = userId === user?.id;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [following, setFollowing] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  useDocumentTitle(profile ? `@${profile.username}` : 'Profile');

  const loadProfile = useCallback(async () => {
    try {
      const res = await api.get<Profile>(`/users/${userId}`);
      setProfile(res.data);
      setStatus('ready');
    } catch (e) {
      setError(getErrorMessage(e, 'Could not load this profile.'));
      setStatus('error');
    }
  }, [userId]);

  useEffect(() => {
    setStatus('loading');
    void loadProfile();
  }, [loadProfile]);

  // Keep the header in sync after editing the profile.
  useEffect(() => {
    if (isMe && user) setProfile(p => (p ? { ...p, displayName: user.displayName, bio: user.bio, avatarUrl: user.avatarUrl } : p));
  }, [isMe, user]);

  const fetchPosts = useCallback((page: number, size: number) => api.get<Post[]>(`/users/${userId}/posts`, { params: { page, size } }).then(r => r.data), [userId]);
  const acceptCreated = useCallback((p: Post) => p.userId === userId, [userId]);
  const posts = usePagedPosts(fetchPosts, { pageSize: 10, acceptCreated });

  async function toggleFollow() {
    if (!profile || following) return;
    setFollowing(true);
    const before = profile;
    setProfile({ ...profile, followedByMe: !profile.followedByMe, followersCount: Math.max(0, profile.followersCount + (profile.followedByMe ? -1 : 1)) });
    try {
      const res = await api.post<{ following: boolean; followersCount: number }>(`/users/${profile.id}/follow`);
      setProfile(p => (p ? { ...p, followedByMe: res.data.following, followersCount: res.data.followersCount } : p));
    } catch (e) {
      setProfile(before); // roll back
      setMessage(getErrorMessage(e, 'Could not update follow status.'));
    } finally {
      setFollowing(false);
    }
  }

  if (status === 'loading') return <LoadingState message="Loading profile…" />;
  if (status === 'error' || !profile) {
    return (
      <>
        <PageHeader title="Profile" back={!isMe} />
        <ErrorState
          message={error}
          onRetry={() => {
            setStatus('loading');
            void loadProfile();
          }}
        />
      </>
    );
  }

  const header = (
    <section className="profile" aria-label="Profile">
      <div className="profile-top">
        <Avatar name={profile.displayName} uri={profile.avatarUrl} size={104} />
        <div className="profile-id">
          <h1 className="profile-name">{profile.displayName}</h1>
          <p className="profile-handle">@{profile.username}</p>
        </div>
      </div>
      {profile.bio ? <p className="profile-bio">{profile.bio}</p> : null}
      <div className="card stats">
        <Stat value={profile.postsCount} label="Posts" />
        <Stat value={profile.followersCount} label="Followers" />
        <Stat value={profile.followingCount} label="Following" />
      </div>
      <div className="profile-actions">
        {isMe ? (
          <Link to="/profile/edit" className="btn btn-secondary">
            <span>Edit profile</span>
          </Link>
        ) : (
          <Button variant={profile.followedByMe ? 'secondary' : 'primary'} onClick={() => void toggleFollow()} loading={following} aria-pressed={profile.followedByMe}>
            {profile.followedByMe ? 'Following' : 'Follow'}
          </Button>
        )}
      </div>
      {isMe ? (
        <div className="card settings">
          <h2 className="settings-title">Appearance</h2>
          <ThemeSwitch />
          <div className="settings-signout">
            <Button variant="secondary" icon="logout" onClick={() => setConfirmLogout(true)}>
              Sign out
            </Button>
          </div>
        </div>
      ) : null}
      <h2 className="section-title">Posts</h2>
      {message ? <Banner text={message} onDismiss={() => setMessage(null)} /> : null}
    </section>
  );

  return (
    <>
      {isMe ? null : <PageHeader title={`@${profile.username}`} back />}
      <PostFeed
        feed={posts}
        header={header}
        empty={<EmptyState title="No posts yet" message={isMe ? 'Share your first moment from the Create page.' : 'Nothing shared yet.'} />}
      />
      <ConfirmDialog
        open={confirmLogout}
        title="Sign out?"
        message="You will need to sign in again to use VibeSphere."
        confirmLabel="Sign out"
        destructive
        onConfirm={() => {
          setConfirmLogout(false);
          void signOut();
        }}
        onCancel={() => setConfirmLogout(false)}
      />
    </>
  );
}
