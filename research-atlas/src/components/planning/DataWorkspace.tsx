import { Download } from 'lucide-react';
import { download } from '@/lib/storage';
import { StructuredDmp } from './StudyPlanning';
import { dmpMarkdown, structuredDmpSchema } from '@/lib/study-planning';
import type { WorkspaceProps } from '@/components/workspace/execution-workspace-types';
import { WorkspaceNotesField } from './WorkspaceNotesField';

const dataTemplate = [
  '### Materials and provenance',
  '### Permissions, consent, and restrictions',
  '### Storage, access, and backups',
  '### File names, versions, and documentation',
  '### Retention, sharing, and disposal',
].join('\n\n');

const analysisTemplate = [
  '### Material or dataset version',
  '### Preparation and exclusions',
  '### Analysis performed and tools used',
  '### Results and links to working files',
  '### Uncertainty, limitations, and deviations from plan',
].join('\n\n');

export function DataWorkspace({ project, update, interfaceMode }: WorkspaceProps) {
  function exportRecords() {
    download('data-and-analysis.md', [
      `# ${project.title}`,
      '## Research question', project.question,
      '## Ethics and access considerations', project.ethics,
      '## Data management plan', dmpMarkdown(project.title, project.structuredDmp ?? structuredDmpSchema.parse({}), project.dataPlan),
      '## Planned analysis', project.analysis,
      '## Analysis record', project.analysisRecord,
    ].join('\n\n'), 'text/markdown');
  }

  return <div className="content-grid">
    <div>
      <StructuredDmp project={project} update={update} interfaceMode={interfaceMode} />
      <section className="panel">
        <h2>Plan how to manage your research materials</h2>
        <p>Record what you expect to collect or reuse, where it comes from, and how it can be kept and shared.</p>
        <button className="button secondary small" disabled={Boolean(project.dataPlan.trim())} onClick={() => update({ dataPlan: dataTemplate })}>
          Add planning prompts
        </button>
        <WorkspaceNotesField label="Data management plan" value={project.dataPlan} onChange={dataPlan => update({ dataPlan })} placeholder="Describe the materials, access permissions, storage, backups, and retention." />
      </section>
      <section className="panel">
        <h2>Document what you analyzed</h2>
        <p>Record the materials and methods you actually used, the results you observed, and any differences from your plan.</p>
        {project.analysis.trim() && <details>
          <summary>Read the analysis plan from Methodology</summary>
          <p style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{project.analysis}</p>
        </details>}
        <button className="button secondary small" disabled={Boolean(project.analysisRecord.trim())} onClick={() => update({ analysisRecord: analysisTemplate })}>
          Add analysis prompts
        </button>
        <WorkspaceNotesField label="Analysis record" value={project.analysisRecord} onChange={analysisRecord => update({ analysisRecord })} placeholder="Record the version, method, results, uncertainty, and links to the analysis files you control." />
        <button className="button" disabled={!project.dataPlan.trim() && !project.analysisRecord.trim()} onClick={exportRecords}>
          <Download size={16} /> Export data and analysis notes
        </button>
      </section>
    </div>
    <aside>
      <section className="panel warm">
        <h3>Work through an example</h3>
        <p>A survey team records the consent restrictions, who can access responses, where the codebook is stored, and which version of the data was analyzed.</p>
        <p>Describe the storage and controls here. Keep participant identifiers, credentials, and raw confidential materials in storage approved for your project.</p>
        {project.ethics.trim() && <details>
          <summary>Read your ethics notes</summary>
          <p style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{project.ethics}</p>
        </details>}
      </section>
    </aside>
  </div>;
}
