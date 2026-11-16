import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import { productionPolicy } from './scripts/production-policy';

function securityPolicyPlugin(gateway: string | undefined): Plugin {
  const policy = productionPolicy(gateway);
  return {
    name: 'atlas-production-policy',
    transformIndexHtml: {
      order: 'pre',
      handler: () => [
        { tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: policy.csp }, injectTo: 'head-prepend' },
        { tag: 'meta', attrs: { name: 'referrer', content: policy.referrerPolicy }, injectTo: 'head-prepend' },
      ],
    },
    generateBundle() {
      const headers = Object.entries(policy.headers).map(([name, value]) => `  ${name}: ${value}`);
      this.emitFile({ type: 'asset', fileName: '_headers', source: ['/*', ...headers, ''].join('\n') });
    },
  };
}

export default defineConfig(({ command, mode }) => ({
  base: './',
  plugins: [react(), ...(command === 'build' ? [securityPolicyPlugin(loadEnv(mode, process.cwd(), 'VITE_').VITE_API_URL)] : [])],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: { outDir: 'out' },
}));
