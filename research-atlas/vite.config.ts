import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import { productionPolicy } from './scripts/production-policy';
import { version } from './package.json';

function securityPolicyPlugin(gateway: string | undefined): Plugin {
  const policy = productionPolicy(gateway);
  const commit = process.env.GITHUB_SHA;
  if (commit && !/^[0-9a-f]{40}$/.test(commit)) throw new Error('GITHUB_SHA must be a full Git commit SHA.');
  return {
    name: 'atlas-production-policy',
    transformIndexHtml: {
      order: 'pre',
      handler: () => [
        { tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: policy.csp }, injectTo: 'head-prepend' },
        { tag: 'meta', attrs: { name: 'referrer', content: policy.referrerPolicy }, injectTo: 'head-prepend' },
        { tag: 'meta', attrs: { name: 'atlas-build-version', content: version }, injectTo: 'head-prepend' },
        ...(commit ? [{ tag: 'meta', attrs: { name: 'atlas-build-commit', content: commit }, injectTo: 'head-prepend' as const }] : []),
      ],
    },
    generateBundle(_options, bundle) {
      for (const entry of Object.values(bundle)) {
        if (entry.type === 'chunk' && Object.keys(entry.modules).some(id => /(?:^|\/)node_modules\/picomatch\//.test(id.replace(/\\/g, '/')))) {
          this.error('picomatch is allowed only in development tooling and must stay outside the browser build.');
        }
      }
      const headers = Object.entries(policy.headers).map(([name, value]) => `  ${name}: ${value}`);
      this.emitFile({ type: 'asset', fileName: '_headers', source: ['/*', ...headers, ''].join('\n') });
    },
  };
}

export default defineConfig(({ command, mode }) => ({
  base: './',
  plugins: [react(), ...(command === 'build' ? [securityPolicyPlugin(loadEnv(mode, process.cwd(), 'VITE_').VITE_API_URL)] : [])],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: {
    outDir: 'out',
    rollupOptions: { output: { manualChunks: { bibliography: ['citeproc', fileURLToPath(new URL('./src/assets/csl/sources.json', import.meta.url))] } } },
  },
}));
