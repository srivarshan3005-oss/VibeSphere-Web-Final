import { useId, useState, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';

type Common = { label: string; error?: string; hint?: string };
type InputProps = Common & Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & { multiline?: false; showToggle?: boolean };
type AreaProps = Common & TextareaHTMLAttributes<HTMLTextAreaElement> & { multiline: true };

export default function TextField(props: InputProps | AreaProps) {
  const id = useId();
  const [reveal, setReveal] = useState(false);
  const { label, error, hint } = props;
  const describedBy = error ? `${id}-err` : hint ? `${id}-hint` : undefined;

  let control;
  if (props.multiline) {
    const { label: _l, error: _e, hint: _h, multiline: _m, className = '', ...rest } = props;
    control = <textarea id={id} className={`input textarea ${className}`.trim()} aria-invalid={!!error} aria-describedby={describedBy} {...rest} />;
  } else {
    const { label: _l, error: _e, hint: _h, multiline: _m, showToggle, className = '', type, ...rest } = props;
    const isPassword = type === 'password';
    control = (
      <div className="input-wrap">
        <input
          id={id}
          className={`input ${className}`.trim()}
          type={isPassword && showToggle && reveal ? 'text' : type}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          {...rest}
        />
        {isPassword && showToggle ? (
          <button type="button" className="input-toggle" onClick={() => setReveal(r => !r)} aria-pressed={reveal}>
            {reveal ? 'Hide' : 'Show'}
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className={`field${error ? ' field-error' : ''}`}>
      <label htmlFor={id}>{label}</label>
      {control}
      {error ? (
        <p id={`${id}-err`} className="field-msg" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="field-msg field-hint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
