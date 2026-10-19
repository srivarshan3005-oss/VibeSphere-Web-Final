import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ErrorState, LoadingState } from '../components/States';
import { safeRedirect } from '../lib/redirect';
import { useAuth } from './authContext';

/** Gate for every signed-in page: sends visitors without a session to /login and remembers where they were going. */
export default function RequireAuth() {
  const { status, retry } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <div className="splash">
        <LoadingState message="Opening VibeSphere…" />
      </div>
    );
  }
  if (status === 'unreachable') {
    return (
      <div className="splash">
        <ErrorState message="Cannot reach the VibeSphere server. Check that the API is running, then try again." onRetry={retry} />
      </div>
    );
  }
  if (status === 'signedOut') {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  return <Outlet />;
}

/** Login and register pages: signed-in users are sent on to the app instead. */
export function PublicOnly() {
  const { status, retry } = useAuth();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  if (status === 'loading') {
    return (
      <div className="splash">
        <LoadingState message="Opening VibeSphere…" />
      </div>
    );
  }
  if (status === 'unreachable') {
    return (
      <div className="splash">
        <ErrorState message="Cannot reach the VibeSphere server. Check that the API is running, then try again." onRetry={retry} />
      </div>
    );
  }
  if (status === 'signedIn') return <Navigate to={safeRedirect(from)} replace />;
  return <Outlet />;
}
