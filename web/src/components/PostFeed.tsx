import { useState, type ReactNode } from 'react';
import Banner from './Banner';
import LoadMore from './LoadMore';
import PostCard from './PostCard';
import { ErrorState, PostSkeleton } from './States';
import { useAuth } from '../auth/authContext';
import type { usePagedPosts } from '../hooks/usePagedPosts';
import { usePostActions } from '../hooks/usePostActions';

type Feed = ReturnType<typeof usePagedPosts>;

/** Renders a paged list of posts with loading, error and empty states, plus the owner/report dialogs. */
export default function PostFeed({ feed, empty, header }: { feed: Feed; empty: ReactNode; header?: ReactNode }) {
  const { user } = useAuth();
  const [message, setMessage] = useState<string | null>(null);
  const actions = usePostActions(setMessage);
  const notice = message ?? feed.notice;
  const profilePath = (id: number) => (id === user?.id ? '/profile' : `/u/${id}`);

  return (
    <>
      {header}
      {notice ? (
        <Banner
          text={notice}
          tone={message ? 'info' : 'error'}
          onDismiss={() => {
            setMessage(null);
            feed.clearNotice();
          }}
        />
      ) : null}
      {feed.status === 'loading' ? (
        <div aria-busy="true" aria-label="Loading posts">
          <PostSkeleton />
          <PostSkeleton />
        </div>
      ) : feed.status === 'error' ? (
        <ErrorState message={feed.error ?? 'Could not load posts.'} onRetry={feed.reload} />
      ) : feed.items.length === 0 ? (
        empty
      ) : (
        <>
          {feed.items.map(p => (
            <PostCard
              key={p.id}
              post={p}
              isOwner={p.userId === user?.id}
              profilePath={profilePath}
              onLike={feed.toggleLike}
              onEdit={actions.askEdit}
              onDelete={actions.askDelete}
              onReport={actions.askReport}
            />
          ))}
          <LoadMore hasMore={feed.hasMore} loading={feed.loadingMore} onLoad={feed.loadMore} />
        </>
      )}
      {actions.dialogs}
    </>
  );
}
