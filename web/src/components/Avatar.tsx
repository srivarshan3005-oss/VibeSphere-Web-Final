import { useState } from 'react';
import { resolveMediaUrl } from '../lib/config';

const PALETTE = ['#6F4DF5', '#D6366F', '#0E8F76', '#B7791F', '#2F6FDB'];

type Props = { name: string; uri?: string | null; size?: number };

export default function Avatar({ name, uri, size = 44 }: Props) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const src = resolveMediaUrl(uri);
  const style = { width: size, height: size, fontSize: size * 0.4 };
  if (src && failedSrc !== src) {
    return <img className="avatar" src={src} alt="" style={style} onError={() => setFailedSrc(src)} />;
  }
  const initial = (name || '?').trim().slice(0, 1).toUpperCase() || '?';
  return (
    <span className="avatar avatar-initial" style={{ ...style, background: PALETTE[initial.charCodeAt(0) % PALETTE.length] }} aria-hidden="true">
      {initial}
    </span>
  );
}
