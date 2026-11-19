import { type ResearchPlan, budgetCurrencies, budgetItems } from '@/lib/research-plan';
import type { ToolProps } from './PlannerWorkbenchTypes';

export function PlannerBudget({ plan, patch }: ToolProps) {
  const entered = Object.values(plan.budget).filter(amount => amount !== undefined);
  const total = entered.reduce((sum, amount) => sum + Math.round(amount * 100), 0) / 100;
  const displayTotal = new Intl.NumberFormat(undefined, { style: 'currency', currency: plan.currency, currencyDisplay: 'code' }).format(total);
  return <section className="panel planner-tool" aria-labelledby="plan-budget">
    <h3 id="plan-budget">Price the project before you commit</h3>
    <p>Reading access, publishing and conference costs are separate. Check the library, the publisher’s routes and waivers, and the organizer’s registration terms before setting your estimates.</p>
    <label className="field planner-currency"><span>Budget currency</span><select value={plan.currency} onChange={event => patch({ currency: event.target.value as ResearchPlan['currency'] })}>
      {budgetCurrencies.map(currency => <option key={currency}>{currency}</option>)}
    </select></label>
    <p className="muted">Use one currency for all entries. Convert existing figures yourself if you change currency. Enter 0 for a confirmed zero cost and leave unpriced items blank.</p>
    <div className="planner-fields">
      {budgetItems.map(item => <label className="field" key={item.id}><span>{item.name}</span><input type="number" min={0} max={1_000_000_000} step="0.01" value={plan.budget[item.id] ?? ''} onChange={event => {
        if (!event.target.validity.valid) return;
        const budget = { ...plan.budget };
        if (event.target.value === '') delete budget[item.id];
        else budget[item.id] = event.target.valueAsNumber;
        patch({ budget });
      }} placeholder="Unpriced" /></label>)}
    </div>
    <p className="planner-total" role="status"><strong>{entered.length ? displayTotal : 'No estimates yet'}</strong> <span>{entered.length ? `Estimated total for ${entered.length} of ${budgetItems.length} entries` : 'Enter a cost to see the running total'}</span></p>
  </section>;
}
