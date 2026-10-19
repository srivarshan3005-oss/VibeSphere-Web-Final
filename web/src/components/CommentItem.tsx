import { memo } from 'react';
import { Link } from 'react-router-dom';
import Avatar from './Avatar';
import type { PostComment } from '../lib/api';
import { timeAgo } from '../lib/format';

type Props = {
  comment: PostComment;
  canDelete: boolean;
  profilePath: string;
  onReply?: (c: PostComment) => void;
  onDelete: (c: PostComment) => void;
};

function CommentItem({ comment, canDelete, profilePath, onReply, onDelete }: Props) {
  const isReply = comment.parentId !== null;
  return (
    <li className={`comment${isReply ? ' comment-reply' : ''}`}>
      <Link to={profilePath} aria-label={`Open ${comment.displayName}’s profile`}>
        <Avatar name={comment.displayName} uri={comment.avatarUrl} size={isReply ? 30 : 38} />
      </Link>
      <div className="comment-body">
        <p className="comment-meta">
          <Link to={profilePath} className="comment-user">
            @{comment.username}
          </Link>{' '}
          · <time dateTime={comment.createdAt}>{timeAgo(comment.createdAt)}</time>
        </p>
        <p className="comment-text">{comment.body}</p>
        <div className="comment-actions">
          {onReply && !isReply ? (
            <button type="button" className="link-btn" onClick={() => onReply(comment)} aria-label={`Reply to ${comment.username}`}>
              Reply
            </button>
          ) : null}
          {canDelete ? (
            <button type="button" className="link-btn link-btn-danger" onClick={() => onDelete(comment)} aria-label={`Delete comment by ${comment.username}`}>
              Delete
            </button>
          ) : null}
        </div>
      </div>
    </li>
  );
}

export default memo(CommentItem);
