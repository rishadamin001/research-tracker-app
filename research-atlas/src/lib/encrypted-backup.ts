import { backupLimitBytes, createBackup, parseBackupFile, type ImportedBackup } from './backup';

export const encryptedBackupExtension = '.atlas-backup';
export const encryptedBackupMimeType = 'application/octet-stream';

const magic = new TextEncoder().encode('RAENC001');
const markerBytes = 5;
const saltOffset = 8;
const nonceOffset = 24;
const headerBytes = 36;
const tagBytes = 16;
const overhead = headerBytes + tagBytes;
const passphraseLimitBytes = 1024;
const iterations = 600_000;

export const encryptedBackupLimitBytes = backupLimitBytes + overhead;

type BackupOptions = NonNullable<Parameters<typeof createBackup>[1]>;
type BackupProjects = Parameters<typeof createBackup>[0];

export function hasEncryptedBackupMarker(bytes: Uint8Array): boolean {
  return magic.subarray(0, markerBytes).every((value, index) => bytes[index] === value);
}

function checkSize(size: number) {
  if (size > encryptedBackupLimitBytes) throw Error('This encrypted backup exceeds the 10 MB import limit.');
  if (size <= overhead) throw Error('This encrypted backup is incomplete.');
}

function checkHeader(bytes: Uint8Array) {
  if (!hasEncryptedBackupMarker(bytes)) throw Error('This is not a Research Atlas encrypted backup.');
  if (!magic.every((value, index) => bytes[index] === value)) throw Error('This encrypted backup uses an unsupported version.');
  if (bytes.length < headerBytes) throw Error('This encrypted backup is incomplete.');
}

export async function readEncryptedBackupFile(file: Blob, signal?: AbortSignal): Promise<Uint8Array<ArrayBuffer>> {
  signal?.throwIfAborted();
  checkSize(file.size);
  const header = new Uint8Array(await file.slice(0, headerBytes).arrayBuffer());
  signal?.throwIfAborted();
  checkHeader(header);
  const bytes = new Uint8Array(await file.arrayBuffer());
  signal?.throwIfAborted();
  checkSize(bytes.byteLength);
  checkHeader(bytes);
  return bytes;
}

function requireCrypto(): Crypto {
  if (!globalThis.crypto?.subtle) throw Error('Encrypted backups require Web Crypto. Open Research Atlas over HTTPS or on localhost.');
  return globalThis.crypto;
}

function encodePassphrase(passphrase: string) {
  if (!passphrase || /[\uD800-\uDFFF]/u.test(passphrase)) throw Error('Enter a valid backup passphrase.');
  const bytes = new TextEncoder().encode(passphrase.normalize('NFC'));
  if (bytes.length <= passphraseLimitBytes) return bytes;
  bytes.fill(0);
  throw Error('This backup passphrase exceeds 1,024 UTF-8 bytes.');
}

async function deriveKey(webCrypto: Crypto, passphrase: string, salt: Uint8Array<ArrayBuffer>, usage: 'encrypt' | 'decrypt', signal?: AbortSignal): Promise<CryptoKey> {
  signal?.throwIfAborted();
  const passphraseBytes = encodePassphrase(passphrase);
  let baseKey: CryptoKey;
  try {
    baseKey = await webCrypto.subtle.importKey('raw', passphraseBytes, 'PBKDF2', false, ['deriveKey']);
  } finally {
    passphraseBytes.fill(0);
  }
  signal?.throwIfAborted();
  const key = await webCrypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, baseKey,
    { name: 'AES-GCM', length: 256 }, false, [usage],
  );
  signal?.throwIfAborted();
  return key;
}

function gcmParameters(header: Uint8Array<ArrayBuffer>): AesGcmParams {
  return { name: 'AES-GCM', iv: header.subarray(nonceOffset), additionalData: header, tagLength: tagBytes * 8 };
}

export async function createEncryptedBackup(projects: BackupProjects, passphrase: string, options: BackupOptions = {}, signal?: AbortSignal): Promise<Uint8Array<ArrayBuffer>> {
  signal?.throwIfAborted();
  const webCrypto = requireCrypto();
  const header = new Uint8Array(headerBytes);
  header.set(magic);
  const salt = webCrypto.getRandomValues(header.subarray(saltOffset, nonceOffset));
  webCrypto.getRandomValues(header.subarray(nonceOffset));

  // Serialize the current workspace before awaiting passphrase derivation.
  const backup = await createBackup(projects, options);
  signal?.throwIfAborted();
  if (new Set(backup.projects.map(project => project.id)).size !== backup.projects.length) {
    throw Error('This workspace contains repeated project identifiers. An encrypted backup could not be created.');
  }
  const plaintext = new TextEncoder().encode(JSON.stringify(backup));
  try {
    if (plaintext.byteLength > backupLimitBytes) throw Error('This workspace exceeds the 10 MB backup limit.');
    const key = await deriveKey(webCrypto, passphrase, salt, 'encrypt', signal);
    const sealed = new Uint8Array(await webCrypto.subtle.encrypt(gcmParameters(header), key, plaintext));
    signal?.throwIfAborted();
    const frame = new Uint8Array(headerBytes + sealed.byteLength);
    frame.set(header);
    frame.set(sealed, headerBytes);
    return frame;
  } finally {
    plaintext.fill(0);
  }
}

export async function openEncryptedBackup(bytes: Uint8Array, passphrase: string, signal?: AbortSignal): Promise<ImportedBackup> {
  signal?.throwIfAborted();
  checkSize(bytes.byteLength);
  // Snapshot the caller's bytes before awaiting the key derivation.
  const frame = new Uint8Array(bytes);
  checkHeader(frame);
  const webCrypto = requireCrypto();
  const header = frame.subarray(0, headerBytes);
  const key = await deriveKey(webCrypto, passphrase, header.subarray(saltOffset, nonceOffset), 'decrypt', signal);
  let plaintext: Uint8Array<ArrayBuffer>;
  try {
    plaintext = new Uint8Array(await webCrypto.subtle.decrypt(gcmParameters(header), key, frame.subarray(headerBytes)));
  } catch {
    signal?.throwIfAborted();
    throw Error('Could not unlock this backup. The passphrase may be incorrect or the file may have changed.');
  }
  try {
    signal?.throwIfAborted();
    let json: string;
    try { json = new TextDecoder('utf-8', { fatal: true }).decode(plaintext); }
    catch { throw Error('This encrypted backup does not contain valid UTF-8 JSON.'); }
    const backup = await parseBackupFile(json);
    signal?.throwIfAborted();
    if (backup.manifest.backupVersion !== 3) throw Error('This encrypted backup does not contain a supported project backup.');
    return backup;
  } catch (error) {
    signal?.throwIfAborted();
    throw error;
  } finally {
    plaintext.fill(0);
  }
}
