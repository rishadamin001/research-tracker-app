import { RotateCcw, SlidersHorizontal } from 'lucide-react';
import { defaultPreferences, type Preferences } from '@/lib/preferences';

export function WorkspacePreferences({ value, onChange }: {
  value: Preferences;
  onChange: (patch: Partial<Preferences>) => void;
}) {
  return <>
    <header className="section-intro">
      <span className="section-symbol"><SlidersHorizontal aria-hidden="true" /></span>
      <div><p className="eyebrow">WORKSPACE SETTINGS</p><h1>Make Atlas yours</h1><p>Adjust how research tasks and saved papers appear on this device.</p></div>
    </header>
    <div className="settings-grid">
      <section className="panel">
        <h2>Appearance</h2>
        <label className="field"><span>Workspace mode</span><select value={value.interfaceMode ?? 'guided'} onChange={event => onChange({ interfaceMode: event.target.value as Preferences['interfaceMode'] })}><option value="guided">Guided — show contextual help</option><option value="expert">Expert — focus on the work</option></select></label>
        <label className="field">
          <span>Color theme</span>
          <select value={value.theme} onChange={event => onChange({ theme: event.target.value as Preferences['theme'] })}>
            <option value="light">Light</option><option value="dark">Dark</option><option value="system">Match this device</option>
          </select>
        </label>
        <label className="field">
          <span>Layout density</span>
          <select value={value.density} onChange={event => onChange({ density: event.target.value as Preferences['density'] })}>
            <option value="comfortable">Comfortable</option><option value="compact">Compact</option>
          </select>
        </label>
        <label className="field">
          <span>Section transitions</span>
          <select value={value.motion} onChange={event => onChange({ motion: event.target.value as Preferences['motion'] })}>
            <option value="system">Follow device motion settings</option><option value="off">Off</option>
          </select>
        </label>
      </section>
      <section className="panel">
        <h2>Project tracking</h2>
        <label className="preference-check"><input type="checkbox" checked={value.openTasksOnly} onChange={event => onChange({ openTasksOnly: event.target.checked })} /> Hide completed tasks on the roadmap</label>
        <p>Open the roadmap to switch between all tasks and unfinished work at any time.</p>
        <button className="button secondary" onClick={() => onChange(defaultPreferences)}><RotateCcw size={16} />Restore display defaults</button>
      </section>
    </div>
  </>;
}
