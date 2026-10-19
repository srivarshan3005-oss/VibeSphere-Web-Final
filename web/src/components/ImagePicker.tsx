import { useEffect, useId, useRef, useState } from 'react';
import Icon from './Icon';
import { ACCEPTED_IMAGE_TYPES } from '../lib/config';
import { validateImageFile } from '../lib/validation';

type Props = {
  file: File | null;
  onChange: (file: File | null) => void;
  error?: string;
  onError: (message: string | undefined) => void;
  /** Shape of the drop area. */
  shape?: 'square' | 'story';
};

/** Click or drag-and-drop image chooser with a local preview (nothing is uploaded until the form is submitted). */
export default function ImagePicker({ file, onChange, error, onError, shape = 'square' }: Props) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function take(f: File | undefined) {
    if (!f) return;
    const problem = validateImageFile(f);
    if (problem) {
      onError(problem);
      return;
    }
    onError(undefined);
    onChange(f);
  }

  return (
    <div>
      <label
        htmlFor={id}
        className={`picker picker-${shape}${dragging ? ' picker-drag' : ''}${error ? ' picker-error' : ''}`}
        onDragOver={e => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => {
          e.preventDefault();
          setDragging(false);
          take(e.dataTransfer.files?.[0]);
        }}
      >
        {preview ? (
          <img src={preview} alt="Selected photo preview" className="picker-preview" />
        ) : (
          <span className="picker-empty">
            <Icon name="image" size={44} />
            <span className="picker-title">Choose a photo</span>
            <span className="picker-hint">or drag one here · JPEG, PNG or WebP up to 5 MB</span>
          </span>
        )}
      </label>
      <input
        id={id}
        ref={input}
        className="visually-hidden"
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(',')}
        onChange={e => {
          take(e.target.files?.[0]);
          e.target.value = ''; // allow choosing the same file again
        }}
      />
      {file ? (
        <button type="button" className="link-btn" onClick={() => input.current?.click()}>
          Change photo
        </button>
      ) : null}
      {error ? (
        <p className="field-msg" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
