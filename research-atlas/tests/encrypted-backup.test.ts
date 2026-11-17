import assert from 'node:assert/strict';
import { createCipheriv, createDecipheriv, createHash, pbkdf2Sync } from 'node:crypto';
import test from 'node:test';
import { backupLimitBytes, createBackup, parseBackupFile } from '../src/lib/backup';
import { createEncryptedBackup, encryptedBackupLimitBytes, hasEncryptedBackupMarker, openEncryptedBackup, readEncryptedBackupFile } from '../src/lib/encrypted-backup';
import { createProject } from '../src/lib/model';
import { defaultPreferences } from '../src/lib/preferences';

const fixturePassphrase = '  Cafe\u0301 \u{1f642} shelf  ';
const fixtureDate = '2026-11-17T00:00:00.000Z';
const fixtureOrigin = 'https://fixture.example';
const authenticationError = 'Could not unlock this backup. The passphrase may be incorrect or the file may have changed.';

// Generated independently with Python hashlib.pbkdf2_hmac and cryptography.AESGCM.
// Salt is bytes 0 through 15, nonce is bytes 16 through 27, and the v3 payload has zero projects.
const externalFixture = 'UkFFTkMwMDEAAQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobQ2qNb+Xn+UJp3CpiiacPa/6LiA5Oe5C5XxpAruacFciq58JauA4dwtiASRriNtfrdNW70ZB/Ta7gDCSYjXg6LMnAjfIeZ8ehLNszOxnUxSZf8mJ+ru68wPsUX6luzlERAvHzZO4ZSY8W+BvCed611lcsb+ptBg0vZP5hIJny/V+KH2Ne0qEMFXt4mKRlrNnK0Ycc8SJe1+F8NqiMHdAbyeZfbRDWfoUMfJuTMZP0SEt3TuneU8e/BQ3NaZyF4ZZ+kjg1nNfmN1EZYW5S5UIj66oHQZthGarXa3suXWbzD6PXHCkRLgqDPla0AZMbUfaTjGP2S2M64oganrwqIU3b55q5cF7AeL46pZqtcUkBb4yFSg+6wGmjxBrt/hnABlbMARL8b5d69AN75vV44iaObA==';
const fixtureBytes = () => new Uint8Array(Buffer.from(externalFixture, 'base64'));

function externalKey(header: Uint8Array, passphrase: string) {
  return pbkdf2Sync(passphrase.normalize('NFC'), header.subarray(8, 24), 600_000, 32, 'sha256');
}

function sealExternally(plaintext: string | Uint8Array) {
  const header = fixtureBytes().subarray(0, 36);
  const cipher = createCipheriv('aes-256-gcm', externalKey(header, fixturePassphrase), header.subarray(24));
  cipher.setAAD(header);
  const ciphertext = typeof plaintext === 'string' ? cipher.update(plaintext, 'utf8') : cipher.update(plaintext);
  return new Uint8Array(Buffer.concat([header, ciphertext, cipher.final(), cipher.getAuthTag()]));
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map(key => `${JSON.stringify(key)}:${canonicalJson(record[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function withChecksum(value: unknown) {
  const payload = JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
  delete payload.checksum;
  const hash = createHash('sha256').update(canonicalJson(payload)).digest('hex');
  return JSON.stringify({ ...payload, checksum: `sha256:${hash}` });
}

test('reads an independent RAENC001 fixture and normalizes canonically equivalent Unicode', async () => {
  const bytes = fixtureBytes();
  const opened = await openEncryptedBackup(bytes, fixturePassphrase.normalize('NFC'));
  assert.deepEqual(opened.projects, []);
  assert.equal(opened.manifest.backupVersion, 3);
  assert.equal(opened.manifest.sourceOrigin, fixtureOrigin);
  assert.equal(opened.manifest.createdAt, fixtureDate);
  assert.equal(opened.manifest.integrity, 'verified');
  assert.equal(hasEncryptedBackupMarker(bytes.subarray(0, 8)), true);
  assert.equal(hasEncryptedBackupMarker(new TextEncoder().encode('{"backupVersion":3}')), false);
});

test('round-trips a project in an independently readable container with fresh salt and nonce', async () => {
  const project = createProject('β research project');
  project.questionDraft = 'What changed across two observations?';
  project.notebookNotes = [{ id: crypto.randomUUID(), kind: 'question', text: 'Check the sample.', sources: [],
    createdAt: fixtureDate, updatedAt: fixtureDate, status: 'open', nextStep: 'Review the methods.' }];
  const options = { createdAt: fixtureDate, sourceOrigin: fixtureOrigin, preferences: defaultPreferences };
  const [first, second] = await Promise.all([
    createEncryptedBackup([project], fixturePassphrase, options),
    createEncryptedBackup([project], fixturePassphrase, options),
  ]);
  assert.equal(Buffer.from(first.subarray(0, 8)).toString('ascii'), 'RAENC001');
  assert.notDeepEqual(first.subarray(8, 24), second.subarray(8, 24));
  assert.notDeepEqual(first.subarray(24, 36), second.subarray(24, 36));
  assert.deepEqual((await readEncryptedBackupFile(new Blob([first], { type: 'text/plain' }))), first);
  const opened = await openEncryptedBackup(first, fixturePassphrase);
  assert.deepEqual(opened.projects, [project]);
  assert.deepEqual(opened.preferences, defaultPreferences);
  assert.equal(opened.manifest.notebookNoteCount, 1);

  const header = first.subarray(0, 36);
  const decipher = createDecipheriv('aes-256-gcm', externalKey(header, fixturePassphrase), header.subarray(24));
  decipher.setAAD(header);
  decipher.setAuthTag(first.subarray(-16));
  const plaintext = Buffer.concat([decipher.update(first.subarray(36, -16)), decipher.final()]).toString('utf8');
  assert.deepEqual(await parseBackupFile(plaintext), opened);
});

test('wrong passphrases and alterations of supported containers share one authentication error', async () => {
  const original = fixtureBytes();
  const tampered = [8, 24, 36, original.length - 1].map(offset => {
    const bytes = original.slice();
    bytes[offset] ^= 1;
    return bytes;
  });
  const appended = new Uint8Array(original.length + 1);
  appended.set(original);
  await Promise.all([
    assert.rejects(openEncryptedBackup(original, fixturePassphrase.trim()), { message: authenticationError }),
    assert.rejects(openEncryptedBackup(original, fixturePassphrase.toLowerCase()), { message: authenticationError }),
    ...[...tampered, original.slice(0, -1), appended].map(bytes =>
      assert.rejects(openEncryptedBackup(bytes, fixturePassphrase), { message: authenticationError })),
  ]);
});

test('authentication does not bypass strict UTF-8, checksum, schema or project-identifier validation', async () => {
  const project = createProject('Bounded recovery');
  const envelope = await createBackup([project]);
  const legacyPlaintext = withChecksum({ ...envelope, backupVersion: 2 });
  assert.equal((await parseBackupFile(legacyPlaintext)).manifest.backupVersion, 2);
  const cases: [string | Uint8Array, RegExp][] = [
    [Uint8Array.of(0xc3, 0x28), /valid UTF-8 JSON/],
    [JSON.stringify({ ...envelope, checksum: `sha256:${'0'.repeat(64)}` }), /integrity check failed/],
    [withChecksum({ ...envelope, projectCount: 2, projects: [project, project] }), /repeated project identifiers/],
    [withChecksum({ ...envelope, extraField: 'unexpected' }), /not a valid Research Atlas backup/],
    [legacyPlaintext, /does not contain a supported project backup/],
  ];
  for (const [plaintext, message] of cases) {
    await assert.rejects(openEncryptedBackup(sealExternally(plaintext), fixturePassphrase), message);
  }
});

test('header, byte-size and passphrase limits are checked before deriving any key', async context => {
  const importKey = context.mock.method(crypto.subtle, 'importKey');
  const damaged = fixtureBytes();
  damaged[0] = 0;
  const future = fixtureBytes();
  future[7] = '2'.charCodeAt(0);
  assert.equal(hasEncryptedBackupMarker(future), true);
  await assert.rejects(openEncryptedBackup(damaged, fixturePassphrase), /not a Research Atlas encrypted backup/);
  await assert.rejects(openEncryptedBackup(future, fixturePassphrase), /unsupported version/);
  await assert.rejects(openEncryptedBackup(fixtureBytes().slice(0, 52), fixturePassphrase), /incomplete/);
  await assert.rejects(openEncryptedBackup(new Uint8Array(encryptedBackupLimitBytes + 1), fixturePassphrase), /10 MB/);
  await assert.rejects(openEncryptedBackup(fixtureBytes(), 'é'.repeat(513)), /1,024 UTF-8 bytes/);
  await assert.rejects(openEncryptedBackup(fixtureBytes(), '\ud800'), /valid backup passphrase/);
  const repeated = createProject('Duplicate fixture');
  await assert.rejects(createEncryptedBackup([repeated, repeated], fixturePassphrase), /repeated project identifiers/);
  assert.equal(importKey.mock.callCount(), 0);
});

test('file preflight checks size and a bounded header before reading the full file', async () => {
  class TrackedBlob extends Blob {
    fullReads = 0;
    slices: [number | undefined, number | undefined][] = [];
    override slice(start?: number, end?: number, contentType?: string): Blob {
      this.slices.push([start, end]);
      return super.slice(start, end, contentType);
    }
    override async arrayBuffer(): Promise<ArrayBuffer> {
      this.fullReads++;
      return super.arrayBuffer();
    }
  }
  const header = fixtureBytes().subarray(0, 36);
  const invalid = new TrackedBlob([new Uint8Array(53)]);
  await assert.rejects(readEncryptedBackupFile(invalid), /not a Research Atlas encrypted backup/);
  assert.deepEqual(invalid.slices, [[0, 36]]);
  assert.equal(invalid.fullReads, 0);

  assert.equal(encryptedBackupLimitBytes, backupLimitBytes + 52);
  const maximum = new TrackedBlob([header, new Uint8Array(backupLimitBytes + 16)]);
  assert.equal((await readEncryptedBackupFile(maximum)).byteLength, encryptedBackupLimitBytes);
  assert.deepEqual(maximum.slices, [[0, 36]]);
  assert.equal(maximum.fullReads, 1);
  const oversized = new TrackedBlob([maximum, new Uint8Array(1)]);
  await assert.rejects(readEncryptedBackupFile(oversized), /10 MB/);
  const emptyFrame = new TrackedBlob([header, new Uint8Array(16)]);
  await assert.rejects(readEncryptedBackupFile(emptyFrame), /incomplete/);
  for (const invalidSize of [oversized, emptyFrame]) {
    assert.deepEqual(invalidSize.slices, []);
    assert.equal(invalidSize.fullReads, 0);
  }
});

test('cancellation discards and clears plaintext after Web Crypto has started', async context => {
  const controller = new AbortController();
  const decrypt = crypto.subtle.decrypt.bind(crypto.subtle);
  let finished: ArrayBuffer | undefined;
  context.mock.method(crypto.subtle, 'decrypt', async (...args: Parameters<SubtleCrypto['decrypt']>) => {
    finished = await decrypt(...args);
    controller.abort();
    return finished;
  });
  await assert.rejects(openEncryptedBackup(fixtureBytes(), fixturePassphrase, controller.signal), { name: 'AbortError' });
  assert.ok(finished);
  assert.ok(new Uint8Array(finished).every(byte => byte === 0), 'The completed plaintext buffer was cleared.');
  await assert.rejects(createEncryptedBackup([], fixturePassphrase, {}, controller.signal), { name: 'AbortError' });
  await assert.rejects(readEncryptedBackupFile(new Blob([fixtureBytes()]), controller.signal), { name: 'AbortError' });
});
