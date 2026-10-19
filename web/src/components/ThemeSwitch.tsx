import { useTheme, type ThemeMode } from '../theme/themeContext';

const MODES: { key: ThemeMode; label: string }[] = [
  { key: 'system', label: 'System' },
  { key: 'light', label: 'Light' },
  { key: 'dark', label: 'Dark' },
];

export default function ThemeSwitch() {
  const { mode, setMode } = useTheme();
  return (
    <div className="segmented" role="radiogroup" aria-label="Theme">
      {MODES.map(m => (
        <button key={m.key} type="button" role="radio" aria-checked={mode === m.key} className={`segment${mode === m.key ? ' segment-on' : ''}`} onClick={() => setMode(m.key)}>
          {m.label}
        </button>
      ))}
    </div>
  );
}
