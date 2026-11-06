# Deployment

## Current status

Local app and production static build provided. No public hosting deployment has been performed. The Cloudflare connection cannot verify billing; its subscription read returns HTTP 403 and requests a Billing Read API token. No credentials should be pasted into chat.

Source repository: https://github.com/rishadamin001/research-tracker-app . The Research Atlas app lives in research-atlas/; existing client/ and server/ tracker files remain intact. Configure research-atlas as the deployment root.

## Static app

After verifying a free account, create a Cloudflare Pages static project. Build command: npm run build; output directory: out; Node: 24. No Functions or paid bindings are needed for the default direct-API version. Use only an explicitly free setup. Headers are in public/_headers. Preview locally with npm run preview after building.

## Optional gateway

Deploy gateway/worker.ts only to verified Workers Free using gateway/wrangler.toml. Set ALLOWED_ORIGIN to the exact production origin. Configure a real OPERATOR_EMAIL as a secret for Unpaywall. OPENALEX_API_KEY is optional and must be a free-only key without prepaid capacity. Set NEXT_PUBLIC_API_URL to the gateway origin at build time, and add that exact origin to connect-src in public/_headers before rebuilding. Do not put secret values in NEXT_PUBLIC variables.

The gateway has no billable storage bindings. Do not add paid services. Smoke-test a real search, DOI lookup, OA link, local save, and backup restore on the final URL. Verify CSP and CORS in the actual production browser. Record the deployed commit and plan verification, and retain a prior static artifact for rollback.
