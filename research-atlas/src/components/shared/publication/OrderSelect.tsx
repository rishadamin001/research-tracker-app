export function OrderSelect<Order extends string>({ label, labels, order, onChange }: {
  label: string;
  labels: Readonly<Record<Order, string>>;
  order: Order;
  onChange: (value: Order) => void;
}) {
  return <label className="field">
    <span>{label}</span>
    <select value={order} onChange={event => onChange(event.target.value as Order)}>
      {Object.entries(labels).map(([value, text]) => <option key={value} value={value}>{String(text)}</option>)}
    </select>
  </label>;
}
