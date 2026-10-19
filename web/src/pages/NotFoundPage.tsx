import { Link } from 'react-router-dom';
import { EmptyState } from '../components/States';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function NotFoundPage() {
  useDocumentTitle('Page not found');
  return (
    <EmptyState
      icon="alert"
      title="Page not found"
      message="That page doesn’t exist or has moved."
      action={
        <Link to="/" className="btn btn-primary">
          <span>Go to Home</span>
        </Link>
      }
    />
  );
}
