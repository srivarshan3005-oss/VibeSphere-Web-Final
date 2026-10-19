import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import PostFeed from '../components/PostFeed';
import StoryRail from '../components/StoryRail';
import { EmptyState } from '../components/States';
import { useAuth } from '../auth/authContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { usePagedPosts } from '../hooks/usePagedPosts';
import { api, type Post } from '../lib/api';
import PageHeader from './PageHeader';

const PAGE = 10;
const acceptCreated = (p: Post) => p.visibility === 'PUBLIC';

export default function HomePage() {
  useDocumentTitle('Home');
  const { user } = useAuth();
  const fetchFeed = useCallback((page: number, size: number) => api.get<Post[]>('/posts', { params: { page, size } }).then(r => r.data), []);
  const feed = usePagedPosts(fetchFeed, { pageSize: PAGE, acceptCreated });

  return (
    <>
      <PageHeader title="Home" subtitle="Fresh moments from your people" />
      <StoryRail myId={user?.id} />
      <PostFeed
        feed={feed}
        empty={
          <EmptyState
            title="No posts yet"
            message="Be the first to share a moment."
            action={
              <Link to="/create" className="btn btn-primary">
                <span>Create a post</span>
              </Link>
            }
          />
        }
      />
    </>
  );
}
