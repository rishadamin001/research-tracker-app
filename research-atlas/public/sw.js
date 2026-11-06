const appRoot = new URL(self.registration.scope);
const cachePrefix = `research-atlas:${appRoot.pathname}:`;
const cacheName = `${cachePrefix}shell-1`;
const entryPath = new URL('index.html', appRoot).pathname;
const assetPrefix = new URL('assets/', appRoot).pathname;
let warmQueue = Promise.resolve();

function isBuildAsset(url) {
  return url.origin === appRoot.origin && !url.search && url.pathname.startsWith(assetPrefix)
    && /^[\w.-]+-[\w-]{8,}\.(?:js|css)$/.test(url.pathname.slice(assetPrefix.length));
}

function shellAssets(html) {
  return [...new Set(Array.from(html.matchAll(/<(?:script|link)\b[^>]*?\b(?:src|href)=["']([^"']+)["']/gi), match => {
    try { return new URL(match[1], appRoot); } catch { return null; }
  }).filter(url => url && isBuildAsset(url)).map(url => url.href))];
}

function warmShell(response) {
  if (!response.ok || !response.headers.get('Content-Type')?.includes('text/html')) {
    return Promise.reject(new Error('App shell unavailable'));
  }
  // Store the HTML only once all of its build assets are available. Keep the
  // prior bundle for tabs still running it when a new version is published.
  warmQueue = warmQueue.catch(() => {}).then(async () => {
    const assets = shellAssets(await response.clone().text());
    if (!assets.some(url => url.endsWith('.js'))) throw Error('App bundle unavailable');
    const cache = await caches.open(cacheName);
    const previous = await cache.match(appRoot.href);
    const previousAssets = previous ? shellAssets(await previous.text()) : [];
    const retained = new Set([appRoot.href, ...assets, ...previousAssets]);
    await Promise.all(assets.map(async url => {
      if (await cache.match(url)) return;
      const asset = await fetch(url, { redirect: 'error' });
      const type = asset.headers.get('Content-Type') ?? '';
      if (!asset.ok || !(url.endsWith('.css') ? type.includes('text/css') : /javascript|ecmascript/.test(type))) {
        throw Error('App asset unavailable');
      }
      await cache.put(url, asset);
    }));
    await cache.put(appRoot.href, response);
    const keys = await cache.keys();
    await Promise.all(keys.filter(key => !retained.has(key.url)).map(key => cache.delete(key)));
  });
  return warmQueue;
}

async function cachedResponse(url) {
  try { return await (await caches.open(cacheName)).match(url); } catch { return undefined; }
}

self.addEventListener('install', event => {
  // Keep the current worker active if a replacement cannot cache the full shell.
  event.waitUntil(fetch(appRoot.href, { cache: 'no-cache' }).then(warmShell));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys
    .filter(key => key.startsWith(cachePrefix) && key !== cacheName)
    .map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== appRoot.origin || url.search) return;

  if (request.mode === 'navigate' && (url.pathname === appRoot.pathname || url.pathname === entryPath)) {
    const online = fetch(request);
    event.waitUntil(online.then(response => warmShell(response.clone())).catch(() => {}));
    event.respondWith(online.catch(async () => (await cachedResponse(appRoot.href)) ?? new Response(
      'Research Atlas is offline. Connect to the internet to open your workspace.',
      { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
    )));
  } else if (isBuildAsset(url)) {
    event.respondWith(cachedResponse(request).then(cached => cached ?? fetch(request)));
  }
});
