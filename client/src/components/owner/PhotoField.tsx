import { useRef, useState } from 'react';
import { MAX_PHOTO_BYTES, PHOTO_TYPES, uploadsApi } from '../../api/uploads';
import { errorMessage } from '../../api/client';
import { Icon } from '../Icon';

interface Props {
  value: string; // current photo URL, '' when there is none
  onChange: (url: string) => void;
  folder: 'services' | 'barbers';
  label: string;
  onBusyChange?: (busy: boolean) => void;
}

// Pick a photo, check it here first (type and size), then upload it straight away
// so the form only has to save the returned URL
export function PhotoField({ value, onChange, folder, label, onBusyChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setError(null);

    if (!PHOTO_TYPES.includes(file.type)) {
      setError('Use a JPG, PNG or WebP photo');
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setError(`That photo is ${(file.size / 1024 / 1024).toFixed(1)} MB, the limit is 2 MB`);
      return;
    }

    setUploading(true);
    onBusyChange?.(true);
    try {
      onChange(await uploadsApi.photo(file, folder));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setUploading(false);
      onBusyChange?.(false);
      if (inputRef.current) inputRef.current.value = ''; // allow picking the same file again
    }
  };

  return (
    <div className={`field photo-field${error ? ' field-error' : ''}`}>
      <span className="field-label">{label}</span>
      <div className="photo-row">
        <div className="photo-preview">
          {value ? <img src={value} alt="" /> : <Icon name="image" size={28} />}
          {uploading && <span className="photo-busy">Uploading...</span>}
        </div>

        <div className="photo-actions">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            <Icon name="upload" size={16} /> {value ? 'Change photo' : 'Add photo'}
          </button>
          {value && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => onChange('')}
              disabled={uploading}
            >
              Remove
            </button>
          )}
          <p className="field-hint">JPG, PNG or WebP, up to 2 MB.</p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={PHOTO_TYPES.join(',')}
        hidden
        onChange={(e) => pick(e.target.files?.[0])}
      />
      {error && <p className="field-message">{error}</p>}
    </div>
  );
}
