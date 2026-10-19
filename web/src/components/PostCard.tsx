import { memo, useState } from 'react';
import { Link } from 'react-router-dom';
import Avatar from './Avatar';
import Icon from './Icon';
import Menu, { type MenuItem } from './Menu';
import type { Post } from '../lib/api';
import { resolveMediaUrl } from '../lib/config';
import { compact, timeAgo } from '../lib/format';

type Props = {
  post: Post;
  isOwner: boolean;
  onLike: (p: Post) => void;
  onEdit: (p: Post) => void;
  onDelete: (p: Post) => void;
  onReport: (p: Post) => void;
  /** Profile of the signed-in user lives at /profile, everyone else at /u/:id. */
  profilePath: (userId: number) => string;
  /** Hide the comments link when the card is already shown on the comments page. */
  hideCommentsLink?: boolean;
};

function PostCard({ post, isOwner, onLike, onEdit, onDelete, onReport, profilePath, hideCommentsLink = false }: Props) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const src = resolveMediaUrl(post.mediaUrl);

  const items: MenuItem[] = isOwner
    ? [
        { label: 'Edit caption', icon: 'edit', onSelect: () => onEdit(post) },
        { label: 'Delete post', icon: 'trash', danger: true, onSelect: () => onDelete(post) },
      ]
    : [{ label: 'Report post', icon: 'flag', onSelect: () => onReport(post) }];

  return (
    <article className="card post" aria-label={`Post by ${post.displayName}`}>
      <header className="post-head">
        <Link to={profilePath(post.userId)} className="post-author" aria-label={`Open ${post.displayName}’s profile`}>
          <Avatar name={post.displayName} uri={post.avatarUrl} />
          <span className="post-author-text">
            <span className="post-name">{post.displayName}</span>
            <span className="post-meta">
              @{post.username} · <time dateTime={post.createdAt}>{timeAgo(post.createdAt)}</time>
            </span>
          </span>
        </Link>
        <Menu label={isOwner ? 'Post options' : 'Report options'} items={items} />
      </header>

      {!src || failedSrc === src ? (
        <div className="post-media post-media-missing" role="img" aria-label="Image unavailable">
          <Icon name="image" size={40} />
          <span>Image unavailable</span>
        </div>
      ) : (
        <img className="post-media" src={src} alt={post.caption || `Photo by ${post.displayName}`} loading="lazy" onError={() => setFailedSrc(src)} />
      )}

      <div className="post-actions">
        <button
          type="button"
          className={`action${post.likedByMe ? ' action-liked' : ''}`}
          onClick={() => onLike(post)}
          aria-pressed={post.likedByMe}
          aria-label={post.likedByMe ? `Unlike, ${post.likesCount} likes` : `Like, ${post.likesCount} likes`}
        >
          <Icon name="heart" size={25} filled={post.likedByMe} />
          <span>{compact(post.likesCount)}</span>
        </button>
        {hideCommentsLink ? (
          <span className="action action-static" aria-label={`${post.commentsCount} comments`}>
            <Icon name="comment" size={24} />
            <span>{compact(post.commentsCount)}</span>
          </span>
        ) : (
          <Link to={`/posts/${post.id}/comments`} state={{ post }} className="action" aria-label={`Comments, ${post.commentsCount}`}>
            <Icon name="comment" size={24} />
            <span>{compact(post.commentsCount)}</span>
          </Link>
        )}
      </div>
      {post.caption ? (
        <p className="post-caption">
          <Link to={profilePath(post.userId)} className="post-caption-user">
            @{post.username}
          </Link>{' '}
          {post.caption}
        </p>
      ) : null}
    </article>
  );
}

export default memo(PostCard);
