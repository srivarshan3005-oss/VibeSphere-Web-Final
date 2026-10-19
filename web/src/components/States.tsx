import type { ReactNode } from 'react';
import Button from './Button';
import Icon, { type IconName } from './Icon';

export function LoadingState({ message = 'Loading…' }: { message?: string }) {
  return (
    <div className="state" role="status" aria-live="polite">
      <span className="spinner spinner-lg" aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="state state-error" role="alert">
      <Icon name="alert" size={34} />
      <p>{message}</p>
      {onRetry ? (
        <Button variant="secondary" icon="refresh" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}

export function EmptyState({ icon = 'image', title, message, action }: { icon?: IconName; title: string; message?: string; action?: ReactNode }) {
  return (
    <div className="state">
      <Icon name={icon} size={34} />
      <h2 className="state-title">{title}</h2>
      {message ? <p>{message}</p> : null}
      {action}
    </div>
  );
}

export function PostSkeleton() {
  return (
    <div className="card post skeleton" aria-hidden="true">
      <div className="skeleton-row">
        <span className="skeleton-block skeleton-circle" />
        <span className="skeleton-lines">
          <span className="skeleton-block skeleton-line" />
          <span className="skeleton-block skeleton-line skeleton-short" />
        </span>
      </div>
      <span className="skeleton-block skeleton-media" />
    </div>
  );
}
