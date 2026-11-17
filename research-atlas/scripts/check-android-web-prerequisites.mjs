import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

const associationRelation = 'delegate_permission/common.handle_all_urls';
const fingerprintPattern = /^(?:[\da-f]{2}:){31}[\da-f]{2}$/i;
const packagePattern = /^[a-zA-Z]\w*(?:\.[a-zA-Z]\w*)+$/;
const pngSignature = Buffer.from('89504e470d0a1a0a', 'hex');
const usage = 'Usage: node scripts/check-android-web-prerequisites.mjs <https-app-url> [--package <application-id> --fingerprint <SHA-256 fingerprint>]';

function readOptions(address, packageId, fingerprint) {
  let appUrl;
  try {
    appUrl = new URL(address);
  } catch {
    throw new Error('Supply the deployed HTTPS app URL.');
  }
  if (appUrl.protocol !== 'https:' || appUrl.username || appUrl.password) {
    throw new Error('Supply an HTTPS app URL without embedded credentials.');
  }
  appUrl.hash = '';
  if (packageId !== undefined || fingerprint !== undefined) {
    if (!packagePattern.test(packageId ?? '') || !fingerprintPattern.test(fingerprint ?? '')) {
      throw new Error('Supply both the Android application ID and a colon-separated SHA-256 certificate fingerprint.');
    }
  }
  return { appUrl, packageId, fingerprint: fingerprint?.toUpperCase() };
}

function findManifestHref(html) {
  const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head\s*>/i)?.[1] ?? '';
  for (const [tag] of head.replace(/<!--[\s\S]*?-->/g, '').matchAll(/<link\b(?:"[^"]*"|'[^']*'|[^'">])*>/gi)) {
    const attributes = new Map();
    for (const [, name, doubleQuoted, singleQuoted, unquoted] of tag.matchAll(/([a-z][\w:-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi)) {
      attributes.set(name.toLowerCase(), doubleQuoted ?? singleQuoted ?? unquoted);
    }
    if (attributes.get('rel')?.toLowerCase().split(/\s+/).includes('manifest')) {
      return attributes.get('href');
    }
  }
}

function sameOriginUrl(value, base, label) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label} is missing.`);
  const url = new URL(value, base);
  if (url.protocol !== 'https:' || url.origin !== base.origin || url.username || url.password) {
    throw new Error(`${label} must use the app's HTTPS origin.`);
  }
  return url;
}

export async function checkAndroidWebPrerequisites(address, packageId, fingerprint, request = fetch) {
  const options = readOptions(address, packageId, fingerprint);
  const { appUrl } = options;
  const appDirectory = new URL('.', appUrl);
  const checks = [];

  async function check(name, run) {
    try {
      const { detail, value } = await run();
      checks.push({ name, status: 'PASS', detail });
      return value;
    } catch (error) {
      checks.push({ name, status: 'FAIL', detail: error.message });
    }
  }

  async function get(url, acceptedTypes) {
    let response;
    try {
      response = await request(url, {
        method: 'GET',
        redirect: 'manual',
        signal: AbortSignal.timeout(10000),
      });
    } catch (error) {
      throw new Error(`Could not reach ${url.href} (${error.cause?.code ?? error.message}).`);
    }
    if (response.status !== 200) {
      const redirect = response.status >= 300 && response.status < 400 ? ' (redirect)' : '';
      throw new Error(`HTTP ${response.status}${redirect} at ${url.href}`);
    }
    const contentType = response.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
    if (!acceptedTypes.includes(contentType)) {
      throw new Error(`Expected ${acceptedTypes.join(' or ')} at ${url.href}. Received ${contentType ?? 'no Content-Type'}.`);
    }
    return response;
  }

  const manifestRecord = await check('Web app manifest', async () => {
    const html = await (await get(appUrl, ['text/html'])).text();
    const manifestUrl = sameOriginUrl(findManifestHref(html), appUrl, 'Manifest link');
    const manifest = await (await get(manifestUrl, ['application/manifest+json', 'application/json'])).json();
    if (typeof manifest?.name !== 'string' || !manifest.name.trim() || manifest.display !== 'standalone') {
      throw new Error('Expected a named web app with display set to standalone.');
    }
    return { detail: manifestUrl.href, value: { manifest, manifestUrl } };
  });

  const launch = manifestRecord && await check('Start URL and scope', async () => {
    const { manifest, manifestUrl } = manifestRecord;
    const start = sameOriginUrl(manifest.start_url, manifestUrl, 'Manifest start_url');
    const scope = sameOriginUrl(manifest.scope, manifestUrl, 'Manifest scope');
    if (!scope.pathname.endsWith('/') || scope.search || scope.hash
        || !scope.pathname.startsWith(appDirectory.pathname)
        || !appUrl.pathname.startsWith(scope.pathname) || !start.pathname.startsWith(scope.pathname)) {
      throw new Error('The manifest scope must cover the inspected page and start URL inside the deployed app directory.');
    }
    if (start.href.split('#')[0] !== appUrl.href) await get(start, ['text/html']);
    return { detail: `${start.href} (scope ${scope.pathname})`, value: scope };
  });

  if (manifestRecord) {
    const { manifest, manifestUrl } = manifestRecord;
    for (const size of [192, 512]) {
      await check(`${size} × ${size} web app icon`, async () => {
        const icon = Array.isArray(manifest.icons) && manifest.icons.find(item =>
          typeof item?.sizes === 'string' && item.sizes.toLowerCase().split(/\s+/).includes(`${size}x${size}`)
          && typeof item.src === 'string');
        const url = sameOriginUrl(icon?.src, manifestUrl, 'Manifest icon');
        const data = Buffer.from(await (await get(url, ['image/png'])).arrayBuffer());
        if (data.length < 24 || !data.subarray(0, 8).equals(pngSignature)
            || data.toString('ascii', 12, 16) !== 'IHDR'
            || data.readUInt32BE(16) !== size || data.readUInt32BE(20) !== size) {
          throw new Error(`The served image does not have the expected ${size} × ${size} PNG header.`);
        }
        return { detail: url.href };
      });
    }
  }

  await check('Service worker file and allowed scope', async () => {
    const workerUrl = new URL('sw.js', appDirectory);
    const response = await get(workerUrl, ['text/javascript', 'application/javascript']);
    const allowedHeader = response.headers.get('service-worker-allowed');
    const allowed = allowedHeader ? sameOriginUrl(allowedHeader, workerUrl, 'Service-Worker-Allowed') : appDirectory;
    if (!appDirectory.pathname.startsWith(allowed.pathname)
        || (launch && !launch.pathname.startsWith(allowed.pathname))) {
      throw new Error(`The worker's allowed scope (${allowed.pathname}) does not cover the app.`);
    }
    if (!(await response.text()).trim()) throw new Error('The service worker file is empty.');
    return { detail: `${workerUrl.href} (allowed scope ${allowed.pathname})` };
  });

  const associationUrl = new URL('/.well-known/assetlinks.json', appUrl);
  const statements = await check('Digital Asset Links endpoint', async () => {
    const json = await (await get(associationUrl, ['application/json'])).json();
    if (!Array.isArray(json)) throw new Error('Digital Asset Links must contain a JSON array of statements.');
    return { detail: associationUrl.href, value: json };
  });
  const name = 'Android package and certificate association';
  if (!options.packageId) {
    checks.push({ name, status: 'PENDING', detail: 'Supply the approved application ID and public signing certificate fingerprint.' });
  } else if (!statements) {
    checks.push({ name, status: 'PENDING', detail: 'An accessible Digital Asset Links endpoint is needed to compare the supplied identity.' });
  } else {
    await check(name, async () => {
      const matching = statements.some(statement => {
        const target = statement?.target;
        return Array.isArray(statement?.relation) && statement.relation.includes(associationRelation)
          && target?.namespace === 'android_app' && target.package_name === options.packageId
          && Array.isArray(target.sha256_cert_fingerprints)
          && target.sha256_cert_fingerprints.some(value =>
            typeof value === 'string' && value.toUpperCase() === options.fingerprint);
      });
      if (!matching) throw new Error('No statement matched the required relation, supplied application ID and signing certificate.');
      return { detail: `Found a statement matching ${options.packageId} and the supplied certificate.` };
    });
  }

  return checks;
}

async function main() {
  try {
    const { values, positionals } = parseArgs({
      options: { help: { type: 'boolean' }, package: { type: 'string' }, fingerprint: { type: 'string' } },
      allowPositionals: true,
    });
    if (values.help) {
      console.log(usage);
      return;
    }
    if (positionals.length !== 1) throw new Error('Supply exactly one deployed app URL.');

    const checks = await checkAndroidWebPrerequisites(positionals[0], values.package, values.fingerprint);
    for (const { name, status, detail } of checks) console.log(`[${status}] ${name} — ${detail}`);
    if (checks.some(check => check.status !== 'PASS')) process.exitCode = 1;
  } catch (error) {
    console.error(error.message);
    console.error(usage);
    process.exitCode = 2;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
