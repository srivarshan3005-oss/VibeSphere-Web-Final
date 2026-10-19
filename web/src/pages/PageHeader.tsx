import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';

export default function PageHeader({ title, subtitle, back = false, action }: { title: string; subtitle?: string; back?: boolean; action?: ReactNode }) {
  const navigate = useNavigate();
  return (
    <div className="page-head">
      {back ? (
        <button type="button" className="icon-btn" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))} aria-label="Go back">
          <Icon name="back" size={22} />
        </button>
      ) : null}
      <div className="page-head-text">
        <h1 className="page-title">{title}</h1>
        {subtitle ? <p className="page-sub">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}
