import { useEffect, useId, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { backupLimitBytes, parseBackupFile, type BackupManifest, type ImportedBackup } from '@/lib/backup';
import { createEncryptedBackup, encryptedBackupExtension, encryptedBackupLimitBytes, encryptedBackupMimeType, hasEncryptedBackupMarker, openEncryptedBackup, readEncryptedBackupFile } from '@/lib/encrypted-backup';
import type { Project } from '@/lib/model';
import type { Preferences } from '@/lib/preferences';
import { showResearchHint } from '@/components/onboarding/researchHints';
import { recordBackupFileCheck } from '@/lib/backup-status-storage';

type Props = {
  projects: Project[];
  preferences: Preferences;
  ready: boolean;
  onReadyToImport: (backup: ImportedBackup, revision: number) => boolean;
  onBackupStarted: (createdAt: string) => void;
  onClearImport: () => number;
};

type FileAction = 'verify' | 'import';
type Prompt = { action: 'export' }
  | { action: 'verify'; bytes: Uint8Array<ArrayBuffer> }
  | { action: 'import'; bytes: Uint8Array<ArrayBuffer>; revision: number };
type Feedback = { kind: 'error' | 'status'; text: string } | { kind: 'checked'; manifest: BackupManifest; encrypted: boolean };

function downloadEncryptedBackup(bytes: Uint8Array<ArrayBuffer>) {
  const url = URL.createObjectURL(new Blob([bytes], { type: encryptedBackupMimeType }));
  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = `research-atlas-backup${encryptedBackupExtension}`;
    link.click();
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

export function EncryptedBackupTools({ projects, preferences, ready, onReadyToImport, onBackupStarted, onClearImport }: Props) {
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const passphrase = useRef<HTMLInputElement>(null);
  const confirmation = useRef<HTMLInputElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const operation = useRef<AbortController | null>(null);
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [dialogError, setDialogError] = useState('');
  const [busy, setBusy] = useState(false);
  const cryptoAvailable = Boolean(globalThis.crypto?.subtle);

  useEffect(() => () => {
    operation.current?.abort();
    operation.current = null;
  }, []);

  function beginOperation() {
    if (!ready || operation.current) return;
    const controller = new AbortController();
    operation.current = controller;
    setBusy(true);
    return controller;
  }

  function finishOperation(controller: AbortController) {
    if (operation.current !== controller) return;
    operation.current = null;
    setBusy(false);
  }

  function clearPassphrases() {
    if (passphrase.current) passphrase.current.value = '';
    if (confirmation.current) confirmation.current.value = '';
  }

  function openPrompt(next: Prompt, trigger: HTMLElement) {
    clearPassphrases();
    setDialogError('');
    setPrompt(next);
    returnFocus.current = trigger;
    dialog.current?.showModal();
    passphrase.current?.focus();
  }

  function closePrompt() {
    clearPassphrases();
    setDialogError('');
    setPrompt(null);
    dialog.current?.close();
    const target = returnFocus.current;
    returnFocus.current = null;
    requestAnimationFrame(() => {
      if (target?.isConnected) target.focus({ preventScroll: true });
    });
  }

  function cancelOperation() {
    operation.current?.abort();
    operation.current = null;
    setBusy(false);
    if (dialog.current?.open) closePrompt();
    setFeedback({ kind: 'status', text: 'Backup operation canceled.' });
  }

  function reportVerifiedFile(manifest: BackupManifest, encrypted: boolean) {
    recordBackupFileCheck();
    setFeedback({ kind: 'checked', manifest, encrypted });
  }

  async function readFile(event: ChangeEvent<HTMLInputElement>, action: FileAction) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    const controller = beginOperation();
    if (!controller) return;
    const { signal } = controller;
    setFeedback(null);
    try {
      const request = action === 'import' ? { action, revision: onClearImport() } : { action };
      if (file.size > encryptedBackupLimitBytes) throw Error('This backup exceeds the 10 MB import limit.');
      const header = new Uint8Array(await file.slice(0, 5).arrayBuffer());
      signal.throwIfAborted();
      if (hasEncryptedBackupMarker(header)) {
        const bytes = await readEncryptedBackupFile(file, signal);
        signal.throwIfAborted();
        if (!cryptoAvailable) throw Error('Open Research Atlas over HTTPS or on localhost to unlock this backup.');
        openPrompt({ ...request, bytes }, input);
      } else {
        if (action === 'import') throw Error('Choose an encrypted Research Atlas backup or use Import backup for JSON files.');
        if (file.size > backupLimitBytes) throw Error('This backup exceeds the 10 MB import limit.');
        const bytes = await file.arrayBuffer();
        signal.throwIfAborted();
        const json = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
        const { manifest } = await parseBackupFile(json);
        signal.throwIfAborted();
        reportVerifiedFile(manifest, false);
      }
    } catch (error) {
      if (!signal.aborted) setFeedback({ kind: 'error', text: error instanceof TypeError ? 'This backup could not be read as a UTF-8 file.' : error instanceof Error ? error.message : 'This backup could not be read.' });
    } finally {
      finishOperation(controller);
    }
  }

  async function submitPassphrase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!prompt || busy) return;
    const value = passphrase.current?.value ?? '';
    const repeated = confirmation.current?.value ?? '';
    clearPassphrases();
    if (prompt.action === 'export' && value.normalize('NFC') !== repeated.normalize('NFC')) {
      setDialogError('The two passphrases must match. Enter them again.');
      passphrase.current?.focus();
      return;
    }
    const controller = beginOperation();
    if (!controller) return;
    const { signal } = controller;
    setDialogError('');
    try {
      if (prompt.action === 'export') {
        const createdAt = new Date().toISOString();
        const bytes = await createEncryptedBackup(projects, value, { preferences, createdAt, sourceOrigin: window.location.origin }, signal);
        signal.throwIfAborted();
        downloadEncryptedBackup(bytes);
        onBackupStarted(createdAt);
        showResearchHint('backup');
        setFeedback({ kind: 'status', text: 'Encrypted backup download started.' });
      } else {
        const backup = await openEncryptedBackup(prompt.bytes, value, signal);
        signal.throwIfAborted();
        if (prompt.action === 'import') {
          if (!onReadyToImport(backup, prompt.revision)) setFeedback({ kind: 'status', text: 'A newer import is active. Choose this backup again to preview it.' });
        } else reportVerifiedFile(backup.manifest, true);
      }
      closePrompt();
    } catch (error) {
      if (!signal.aborted) {
        setDialogError(error instanceof Error ? error.message : 'This encrypted backup could not be processed.');
        passphrase.current?.focus();
      }
    } finally {
      finishOperation(controller);
    }
  }

  const exporting = prompt?.action === 'export';
  const verifying = prompt?.action === 'verify';
  return <>
    <p className="muted">Encryption protects the downloaded file. Your working projects are stored separately in this browser.</p>
    <div className="button-row">
      <button type="button" className="button secondary" aria-haspopup="dialog" disabled={!ready || busy || !cryptoAvailable} onClick={event => {
        if (operation.current) return;
        setFeedback(null);
        openPrompt({ action: 'export' }, event.currentTarget);
      }}>Download encrypted backup</button>
      <label className="button secondary upload">Verify backup<input type="file" disabled={!ready || busy} accept={`.json,application/json,${encryptedBackupExtension},${encryptedBackupMimeType}`} onChange={event => void readFile(event, 'verify')} /></label>
      <label className="button secondary upload">Import encrypted backup<input type="file" disabled={!ready || busy || !cryptoAvailable} accept={`${encryptedBackupExtension},${encryptedBackupMimeType}`} onChange={event => void readFile(event, 'import')} /></label>
    </div>
    {!cryptoAvailable && <p className="muted">Encrypted backups require Web Crypto. Open Research Atlas over HTTPS or on localhost.</p>}
    {busy && !prompt && <div className="button-row"><p role="status">Checking backup file…</p><button type="button" className="text-button" onClick={cancelOperation}>Cancel backup check</button></div>}
    {feedback?.kind === 'checked' ? <div className="recommendation" role="status">
      <h3>Backup checked</h3>
      <p>Backup v{feedback.manifest.backupVersion} · {feedback.manifest.projectCount} projects · {feedback.manifest.paperCount} references · {feedback.manifest.notebookNoteCount} notebook notes.</p>
      <p>{feedback.encrypted ? 'The file unlocked and its checksum matched.' : feedback.manifest.integrity === 'verified' ? 'The file was readable and its checksum matched.' : 'The file was readable. This older format did not record a checksum.'} Your projects have not changed.</p>
    </div> : feedback && <p className={feedback.kind === 'error' ? 'error' : 'muted'} role={feedback.kind === 'error' ? 'alert' : 'status'}>{feedback.text}</p>}
    <dialog ref={dialog} className="journey-dialog" aria-labelledby={`${id}-title`} aria-describedby={`${id}-hint`} onCancel={event => { event.preventDefault(); cancelOperation(); }}>
      <form onSubmit={event => void submitPassphrase(event)}>
        <h2 id={`${id}-title`}>{exporting ? 'Encrypt a backup' : verifying ? 'Verify an encrypted backup' : 'Unlock a backup for import'}</h2>
        <p id={`${id}-hint`}>{exporting ? 'Choose a passphrase you can keep safe. You need it to open the downloaded file.' : verifying ? 'Enter the passphrase to check this file. Verification leaves your projects unchanged.' : 'Enter the passphrase to preview the projects before importing.'}</p>
        <label className="field"><span>Passphrase</span><input ref={passphrase} type="password" autoComplete={exporting ? 'new-password' : 'off'} maxLength={1024} readOnly={busy && Boolean(prompt)} required /></label>
        {exporting && <label className="field"><span>Confirm passphrase</span><input ref={confirmation} type="password" autoComplete="new-password" maxLength={1024} readOnly={busy} required /></label>}
        {dialogError && <p className="error" role="alert">{dialogError}</p>}
        {busy && prompt && <p role="status">{exporting ? 'Encrypting backup…' : 'Unlocking backup…'}</p>}
        <div className="button-row">
          <button type="submit" className="button" disabled={busy}>{exporting ? 'Encrypt and download' : verifying ? 'Unlock and verify' : 'Unlock and preview'}</button>
          <button type="button" className="button secondary" onClick={cancelOperation}>Cancel</button>
        </div>
      </form>
    </dialog>
  </>;
}
