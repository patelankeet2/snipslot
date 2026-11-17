import { cloneElement, isValidElement, type ReactElement } from 'react';

interface Props {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: ReactElement<Record<string, unknown>>;
}

// Label + input + message. Wires up aria attributes so screen readers
// announce the error together with the field.
export function FormField({ id, label, error, hint, children }: Props) {
  const messageId = `${id}-message`;
  const input = isValidElement(children)
    ? cloneElement(children, {
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': error || hint ? messageId : undefined,
      })
    : children;

  return (
    <div className={`field${error ? ' field-error' : ''}`}>
      <label htmlFor={id}>{label}</label>
      {input}
      {error ? (
        <p className="field-message" id={messageId}>
          {error}
        </p>
      ) : (
        hint && (
          <p className="field-hint" id={messageId}>
            {hint}
          </p>
        )
      )}
    </div>
  );
}
