import { z } from 'zod';
import { parseBackup, projectSchema, type Project } from './model';
import type { Preferences } from './preferences';

export const appVersion = '0.6.0';
export const backupLimitBytes = 10_000_000;
const preferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']), density: z.enum(['comfortable', 'compact']),
  motion: z.enum(['system', 'off']), openTasksOnly: z.boolean(),
});
const originSchema = z.string().max(1200).refine(value => {
  if (value === 'unknown') return true;
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) && url.origin === value; }
  catch { return false; }
});
const payloadSchema = z.object({
  format: z.literal('research-atlas-backup'), backupVersion: z.literal(2), schemaVersion: z.literal(1),
  appVersion: z.string().min(1).max(40), createdAt: z.iso.datetime(), sourceOrigin: originSchema,
  projectCount: z.number().int().min(0).max(100), projects: z.array(projectSchema).max(100),
  preferences: preferencesSchema.optional(),
});
const envelopeSchema = payloadSchema.extend({ checksum: z.string().regex(/^sha256:[0-9a-f]{64}$/) }).strict();
export type BackupManifest = {
  backupVersion: 1 | 2; appVersion: string; createdAt: string; sourceOrigin: string;
  projectCount: number; paperCount: number; screeningEventCount: number; evidenceClaimCount: number;
  integrity: 'verified' | 'legacy-unchecked'; preferencesIncluded: boolean;
};
export type ImportedBackup = { projects: Project[]; manifest: BackupManifest; preferences?: Preferences };

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    const object = value as Record<string, unknown>;
    return `{${Object.keys(object).filter(key => object[key] !== undefined).sort().map(key => `${JSON.stringify(key)}:${canonical(object[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

async function checksum(value: unknown) {
  if (!globalThis.crypto?.subtle) throw Error('This browser cannot verify backup integrity. Open Research Atlas over HTTPS or on localhost.');
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical(value)));
  return `sha256:${Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')}`;
}

export async function createBackup(projects: Project[], options: { sourceOrigin?: string; preferences?: Preferences; createdAt?: string } = {}) {
  const payload = payloadSchema.parse({
    format: 'research-atlas-backup', backupVersion: 2, schemaVersion: 1, appVersion,
    createdAt: options.createdAt ?? new Date().toISOString(), sourceOrigin: options.sourceOrigin ?? 'unknown',
    projectCount: projects.length, projects, preferences: options.preferences,
  });
  const envelope = { ...payload, checksum: await checksum(payload) };
  if (new TextEncoder().encode(JSON.stringify(envelope, null, 2)).length > backupLimitBytes) {
    throw Error('This workspace exceeds the 10 MB backup limit. Export protocols and references separately, then reduce large notes before making a portable backup.');
  }
  return envelope;
}

function counts(projects: Project[]) {
  const papers = projects.flatMap(project => project.papers);
  return { projectCount: projects.length, paperCount: papers.length,
    screeningEventCount: papers.reduce((count, paper) => count + (paper.screeningEvents?.length ?? 0), 0),
    evidenceClaimCount: papers.reduce((count, paper) => count + (paper.evidenceClaims?.length ?? 0), 0) };
}

export async function parseBackupFile(raw: string): Promise<ImportedBackup> {
  if (new TextEncoder().encode(raw).length > backupLimitBytes) throw Error('This backup exceeds the 10 MB import limit.');
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { throw Error('This is not a valid Research Atlas JSON backup. Your projects have not changed.'); }
  if (parsed && typeof parsed === 'object' && !('backupVersion' in parsed)) {
    const legacy = parseBackup(raw);
    return { projects: legacy.projects, manifest: { ...counts(legacy.projects), backupVersion: 1, appVersion: 'Not recorded',
      createdAt: legacy.exportedAt, sourceOrigin: 'Not recorded in version 1', integrity: 'legacy-unchecked', preferencesIncluded: false } };
  }
  const result = envelopeSchema.safeParse(parsed);
  if (!result.success) throw Error('This is not a valid Research Atlas version 2 backup. Your projects have not changed.');
  // Verify the original serialized values before defaults/migrations can alter them.
  const { checksum: supplied, ...original } = parsed as Record<string, unknown>;
  if (await checksum(original) !== supplied) throw Error('Backup integrity check failed. The file may be incomplete or changed. Your projects have not changed.');
  const data = result.data;
  if (data.projectCount !== data.projects.length) throw Error('The backup project count does not match its records. Your projects have not changed.');
  const ids = data.projects.map(project => project.id);
  if (new Set(ids).size !== ids.length) throw Error('The backup contains repeated project identifiers. Your projects have not changed.');
  return { projects: data.projects, preferences: data.preferences,
    manifest: { ...counts(data.projects), backupVersion: 2, appVersion: data.appVersion, createdAt: data.createdAt,
      sourceOrigin: data.sourceOrigin, integrity: 'verified', preferencesIncluded: data.preferences !== undefined } };
}
