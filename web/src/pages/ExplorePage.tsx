import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Avatar from '../components/Avatar';
import Icon from '../components/Icon';
import { EmptyState, ErrorState, LoadingState } from '../components/States';
import { useAuth } from '../auth/authContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { api, getErrorMessage, type PublicUser } from '../lib/api';
import PageHeader from './PageHeader';

export default function ExplorePage() {
  useDocumentTitle('Explore');
  const { user } = useAuth();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<PublicUser[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');
  const seq = useRef(0);
  const term = q.trim();

  async function run(t: string) {
    const id = ++seq.current; // ignore responses that arrive after a newer search started
    setStatus('loading');
    try {
      const res = await api.get<PublicUser[]>('/users/search', { params: { q: t } });
      if (id === seq.current) {
        setResults(res.data);
        setStatus('done');
      }
    } catch (e) {
      if (id === seq.current) {
        setError(getErrorMessage(e, 'Search failed.'));
        setStatus('error');
      }
    }
  }

  useEffect(() => {
    if (term.length < 2) {
      seq.current++;
      setResults([]);
      setStatus('idle');
      return;
    }
    const t = setTimeout(() => void run(term), 400); // debounce typing
    return () => clearTimeout(t);
  }, [term]);

  return (
    <>
      <PageHeader title="Explore" subtitle="Find people on VibeSphere" />
      <div className="search">
        <Icon name="search" size={20} />
        <input
          type="search"
          aria-label="Search people"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search by name or username"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={50}
        />
      </div>

      {status === 'idle' ? (
        <EmptyState icon="search" title="Search for people" message="Type at least 2 characters." />
      ) : status === 'loading' ? (
        <LoadingState message="Searching…" />
      ) : status === 'error' ? (
        <ErrorState message={error} onRetry={() => void run(term)} />
      ) : results.length === 0 ? (
        <EmptyState icon="user" title="No matches" message={`Nobody found for “${term}”.`} />
      ) : (
        <ul className="people" aria-label="Search results">
          {results.map(u => (
            <li key={u.id}>
              <Link to={u.id === user?.id ? '/profile' : `/u/${u.id}`} className="person">
                <Avatar name={u.displayName} uri={u.avatarUrl} />
                <span className="person-text">
                  <span className="person-name">{u.displayName}</span>
                  <span className="person-handle">@{u.username}</span>
                  {u.bio ? <span className="person-bio">{u.bio}</span> : null}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
