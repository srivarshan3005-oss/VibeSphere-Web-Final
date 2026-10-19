import { useRef, useState, type FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Banner from '../components/Banner';
import Button from '../components/Button';
import TextField from '../components/TextField';
import { useAuth } from '../auth/authContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { getErrorMessage } from '../lib/api';
import { hasErrors, validateLogin, validateRegister } from '../lib/validation';

type Fields = 'username' | 'displayName' | 'email' | 'password';

export default function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { signIn, sessionExpired } = useAuth();
  const location = useLocation();
  const [form, setForm] = useState({ username: '', displayName: '', email: '', password: '' });
  const [errors, setErrors] = useState<Partial<Record<Fields, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const isLogin = mode === 'login';
  useDocumentTitle(isLogin ? 'Sign in' : 'Create account');

  const set = (k: Fields) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    setErrors(er => ({ ...er, [k]: undefined }));
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (submitting.current) return; // block double submits
    const errs = isLogin ? validateLogin(form) : validateRegister(form);
    setErrors(errs);
    setFormError(null);
    if (hasErrors(errs)) return;
    submitting.current = true;
    setBusy(true);
    try {
      await signIn(mode, form); // on success PublicOnly redirects away from this page
    } catch (err) {
      setFormError(getErrorMessage(err, isLogin ? 'Could not sign in.' : 'Could not create your account.'));
      submitting.current = false;
      setBusy(false);
    }
  }

  return (
    <div className="auth">
      <section className="auth-hero" aria-hidden="true">
        <div className="orb orb-a" />
        <div className="orb orb-b" />
        <div className="orb orb-c" />
        <p className="auth-hero-word">VibeSphere</p>
        <p className="auth-hero-line">Your people. Your moments. Your vibe.</p>
      </section>

      <main className="auth-panel">
        <div className="auth-card">
          <p className="auth-brand-mobile">VibeSphere</p>
          {sessionExpired ? <Banner tone="info" text="Your session expired. Please sign in again." /> : null}
          <h1 className="auth-title">{isLogin ? 'Welcome back' : 'Create your account'}</h1>
          <p className="auth-sub">{isLogin ? 'Sign in to see what your people shared.' : 'Pick a username and start sharing.'}</p>

          <form onSubmit={submit} noValidate>
            {!isLogin ? (
              <>
                <TextField label="Display name" value={form.displayName} onChange={set('displayName')} error={errors.displayName} autoComplete="name" maxLength={80} />
                <TextField label="Username" value={form.username} onChange={set('username')} error={errors.username} autoComplete="username" autoCapitalize="none" spellCheck={false} maxLength={30} />
              </>
            ) : null}
            <TextField label="Email" type="email" value={form.email} onChange={set('email')} error={errors.email} autoComplete="email" autoCapitalize="none" spellCheck={false} />
            <TextField
              label="Password"
              type="password"
              showToggle
              value={form.password}
              onChange={set('password')}
              error={errors.password}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              hint={isLogin ? undefined : 'Use 8–72 characters.'}
            />
            {formError ? (
              <p className="form-error" role="alert">
                {formError}
              </p>
            ) : null}
            <Button type="submit" block loading={busy}>
              {isLogin ? 'Sign in' : 'Create account'}
            </Button>
          </form>

          <p className="auth-switch">
            {isLogin ? 'New to VibeSphere?' : 'Already have an account?'}{' '}
            <Link to={isLogin ? '/register' : '/login'} state={location.state}>
              {isLogin ? 'Create an account' : 'Sign in'}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
