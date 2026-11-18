import { useId } from 'react';

type TextFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  multiline?: boolean;
};

export function PlanningTextField({ label, value, onChange, hint, multiline }: TextFieldProps) {
  const id = useId();
  const attributes = {
    id,
    value,
    maxLength: 20_000,
    'aria-describedby': hint ? `${id}-hint` : undefined,
  };

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {hint && <small id={`${id}-hint`}>{hint}</small>}
      {multiline ? (
        <textarea {...attributes} rows={3} onChange={event => onChange(event.target.value)} />
      ) : (
        <input {...attributes} onChange={event => onChange(event.target.value)} />
      )}
    </div>
  );
}
