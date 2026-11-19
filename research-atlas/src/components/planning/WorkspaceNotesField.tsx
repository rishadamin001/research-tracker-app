export function WorkspaceNotesField({ label, value, onChange, placeholder, rows = 6 }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return <label className="field">
    <span>{label}</span>
    <textarea aria-label={label} rows={rows} maxLength={20000} value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} />
  </label>;
}
