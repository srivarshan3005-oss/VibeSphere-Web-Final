import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import Avatar from './Avatar';
import Banner from './Banner';
import Icon, { type IconName } from './Icon';
import { ConfirmDialog } from './Dialog';
import ThemeSwitch from './ThemeSwitch';
import { useAuth } from '../auth/authContext';
import { useOnline } from '../hooks/useOnline';
import { useTheme } from '../theme/themeContext';

const NAV: { to: string; label: string; icon: IconName; end?: boolean }[] = [
  { to: '/', label: 'Home', icon: 'home', end: true },
  { to: '/explore', label: 'Explore', icon: 'search' },
  { to: '/create', label: 'Create', icon: 'plus' },
  { to: '/profile', label: 'Profile', icon: 'user' },
];

function Brand() {
  return (
    <Link to="/" className="brand" aria-label="VibeSphere home">
      <svg className="brand-mark" viewBox="0 0 64 64" width="34" height="34" aria-hidden="true" focusable="false">
        <circle cx="32" cy="32" r="30" fill="var(--primary)" />
        <circle cx="40" cy="26" r="16" fill="var(--pink)" opacity=".92" />
        <circle cx="26" cy="40" r="12" fill="#fff" opacity=".92" />
      </svg>
      <span className="brand-name">VibeSphere</span>
    </Link>
  );
}

export default function AppShell() {
  const { user, signOut } = useAuth();
  const { resolved, setMode } = useTheme();
  const online = useOnline();
  const [confirmOut, setConfirmOut] = useState(false);

  return (
    <div className="shell">
      <a href="#main" className="skip-link">
        Skip to content
      </a>

      <header className="topbar">
        <Brand />
        <button
          type="button"
          className="icon-btn"
          onClick={() => setMode(resolved === 'dark' ? 'light' : 'dark')}
          aria-label={resolved === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          <Icon name={resolved === 'dark' ? 'sun' : 'moon'} size={22} />
        </button>
      </header>

      <nav className="nav" aria-label="Main">
        <div className="nav-brand">
          <Brand />
        </div>
        <ul className="nav-list">
          {NAV.map(item => (
            <li key={item.to}>
              <NavLink to={item.to} end={item.end} className={({ isActive }) => `nav-link${isActive ? ' nav-link-active' : ''}`}>
                {({ isActive }) => (
                  <>
                    <Icon name={item.icon} size={24} filled={isActive && item.icon === 'home'} />
                    <span className="nav-label">{item.label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <main id="main" className="main" tabIndex={-1}>
        {!online ? (
          <Banner tone="info" text="You’re offline. Showing what was loaded earlier; new activity will appear when you reconnect." />
        ) : null}
        <Outlet />
      </main>

      <aside className="aside" aria-label="Your account">
        {user ? (
          <div className="card account">
            <Link to="/profile" className="account-who">
              <Avatar name={user.displayName} uri={user.avatarUrl} size={52} />
              <span className="account-text">
                <span className="account-name">{user.displayName}</span>
                <span className="account-handle">@{user.username}</span>
              </span>
            </Link>
            <div className="account-section">
              <p className="account-label">Theme</p>
              <ThemeSwitch />
            </div>
            <div className="account-links">
              <Link to="/profile/edit" className="link-btn">
                Edit profile
              </Link>
              <button type="button" className="link-btn" onClick={() => setConfirmOut(true)}>
                Sign out
              </button>
            </div>
          </div>
        ) : null}
      </aside>

      <ConfirmDialog
        open={confirmOut}
        title="Sign out?"
        message="You will need to sign in again to use VibeSphere."
        confirmLabel="Sign out"
        destructive
        onConfirm={() => {
          setConfirmOut(false);
          void signOut();
        }}
        onCancel={() => setConfirmOut(false)}
      />
    </div>
  );
}
