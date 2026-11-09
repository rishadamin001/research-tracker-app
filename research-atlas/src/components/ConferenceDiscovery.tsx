import { useState } from 'react';
import { ArrowRight, ClipboardList, Globe2, Search, ShieldCheck } from 'lucide-react';
import { conferenceDirectories } from '@/lib/conferences';
import { conferenceBriefError, conferenceDiscoverySources, conferenceSearchBrief, type ConferenceRegion, type DirectoryOrganization } from '@/lib/conference-discovery';
import { External } from './External';

export function ConferenceDiscovery({ region, onRegionChange, onAddLead }: {
  region: ConferenceRegion; onRegionChange: (region: ConferenceRegion) => void; onAddLead: () => void;
}) {
  const [topic, setTopic] = useState('');
  const [location, setLocation] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [from, setFrom] = useState('');
  const [until, setUntil] = useState('');
  const [organization, setOrganization] = useState<DirectoryOrganization>('all');
  const [message, setMessage] = useState('');
  const [copiedFor, setCopiedFor] = useState('');
  const brief = { region, topic, location, organizer, from, until };
  const error = conferenceBriefError(brief);
  const searchBrief = conferenceSearchBrief(brief);
  const activeOrganization = organization === 'all' || conferenceDiscoverySources(region, organization).length ? organization : 'all';
  const sources = conferenceDiscoverySources(region, activeOrganization);

  async function copyBrief() {
    setCopiedFor(searchBrief);
    try { await navigator.clipboard.writeText(searchBrief); setMessage('Search brief copied. Paste the relevant terms into your chosen directory and apply its filters.'); }
    catch { setMessage('Clipboard access is unavailable. Select and copy the search brief below.'); }
  }

  return <section className="conference-discovery" aria-label="Discover conference directories">
    <header className="conference-discovery-intro"><Globe2 size={25} aria-hidden="true" /><div><h2>Discover beyond the curated list</h2><p>Use official directories to look more widely. The shortlist in Atlas is small; a missing result there does not mean no conference exists.</p><p className="conference-muted">This workspace prepares a search brief and points you to sources. It does not retrieve live event records or automatically apply these filters on another website.</p></div></header>
    <section className="conference-discovery-search" aria-labelledby="conference-discovery-search-title">
      <h3 id="conference-discovery-search-title"><Search size={18} aria-hidden="true" /> Prepare your directory search</h3>
      <div className="conference-form-grid">
        <label>Topic or keywords<input aria-label="Topic or keywords" type="search" maxLength={200} value={topic} onChange={event => { setTopic(event.target.value); setMessage(''); }} placeholder="For example, public health or artificial intelligence" /></label>
        <label>Where will the event be held?<select aria-label="Where will the event be held?" value={region} onChange={event => { onRegionChange(event.target.value as ConferenceRegion); setOrganization('all'); setMessage(''); }}><option value="bangladesh">Bangladesh</option><option value="international">International</option></select></label>
      </div>
      <details><summary>Optional dates, place and organizer</summary><div className="conference-form-grid conference-optional-filters">
        <label>Country, city or online format<input aria-label="Country, city or online format" maxLength={160} value={location} onChange={event => { setLocation(event.target.value); setMessage(''); }} placeholder="For example, Dhaka, Japan or online" /></label>
        <label>Organizer or society<input aria-label="Organizer or society" maxLength={160} value={organizer} onChange={event => { setOrganizer(event.target.value); setMessage(''); }} placeholder="For example, a university or scholarly society" /></label>
        <label>Earliest conference date<input aria-label="Earliest conference date" type="date" value={from} onChange={event => { setFrom(event.target.value); setMessage(''); }} /></label>
        <label>Latest conference date<input aria-label="Latest conference date" type="date" value={until} onChange={event => { setUntil(event.target.value); setMessage(''); }} /></label>
      </div></details>
      <p className="conference-muted">Dates describe when you want to attend, not paper deadlines. Confirm both on the organizer’s event page.</p>
      {error && <p className="error" role="alert">{error}</p>}
      <label>Search brief<textarea aria-label="Conference directory search brief" value={searchBrief} readOnly rows={6} onFocus={event => event.currentTarget.select()} /></label>
      <div className="conference-actions"><button type="button" className="button secondary" disabled={Boolean(error)} onClick={() => void copyBrief()}><ClipboardList size={16} aria-hidden="true" />Copy search brief</button><span className="conference-muted">Then open a directory below and apply the relevant details there.</span></div>
      {message && copiedFor === searchBrief && <p role="status" className="conference-status">{message}</p>}
    </section>
    <section aria-labelledby="conference-official-sources-title">
      <h3 id="conference-official-sources-title">Choose an official starting point</h3>
      <label className="conference-source-filter">Show directory organization<select aria-label="Show directory organization" value={activeOrganization} onChange={event => setOrganization(event.target.value as DirectoryOrganization)}>
        <option value="all">All listed organizations</option><option value="ieee">IEEE</option><option value="acm">ACM</option><option value="nature" disabled={region === 'bangladesh'}>Nature</option><option value="who" disabled={region === 'bangladesh'}>WHO</option><option value="unesco" disabled={region === 'bangladesh'}>UNESCO</option><option value="bangladesh" disabled={region !== 'bangladesh'}>Bangladesh society and university sources</option>
      </select></label>
      <p className="conference-muted">{sources.length} source links shown. This is a source catalog, not a count of conferences or matches for your topic.</p>
      <div className="conference-directory-grid">{sources.map(source => <article className="conference-directory-card" key={source.id}>
        <span className="conference-badge">{source.kind}</span><h4>{source.label}</h4><p>{source.scope}</p><p className="conference-muted">{source.instructions}</p><External href={source.url}>Open {source.label}</External>
      </article>)}</div>
    </section>
    <details className="conference-directories"><summary>Broader alert sites · unverified leads</summary><p>These third-party listings can suggest events to investigate. They are not organizer-verified Atlas records; a directory listing does not establish legitimacy, peer review or indexing.</p><ul>{conferenceDirectories[region].discovery.map(source => <li key={source.url}><External href={source.url}>{source.label}</External></li>)}</ul></details>
    <aside className="conference-lead-next"><ShieldCheck size={23} aria-hidden="true" /><div><h3>Found a possible event?</h3><p>Open the organizer’s own website and check its identity, dates, submission rules, fees and any indexing claim. Add the details to your tracker only when you choose. A personal tracker entry remains unchecked by Atlas.</p><button type="button" className="button secondary" onClick={onAddLead}>Add a lead to My tracker <ArrowRight size={15} aria-hidden="true" /></button></div></aside>
  </section>;
}
