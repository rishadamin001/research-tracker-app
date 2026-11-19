export function StudyContextChoice({ label, value, options, onChange }: {
  label: string; value: string; options: readonly (readonly [string, string])[]; onChange: (value: string) => void;
}) {
  return <label className="field"><span>{label}</span><select aria-label={label} value={value} onChange={event => onChange(event.target.value)}>
    <option value="">Choose a response</option>
    {options.map(([id, text]) => <option key={id} value={id}>{text}</option>)}
  </select></label>;
}
