export function PlanningSelectField<T extends string>({ label, value, choices, onChange }: {
  label: string;
  value: T;
  choices: ReadonlyArray<readonly [T, string]>;
  onChange: (value: T) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={event => onChange(event.target.value as T)}>
        {value && !choices.some(([key]) => key === value) && <option value={value}>{value}</option>}
        {choices.map(([key, name]) => <option key={key} value={key}>{name}</option>)}
      </select>
    </label>
  );
}
