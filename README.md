# Lab Report Analyzer

Analyse medical lab reports **entirely in your browser**. There is no backend, no analytics and no network calls at runtime: your data never leaves your device.

## Stack

Next.js (App Router, TypeScript, static export) · Tailwind CSS · shadcn/ui · lucide-react · Vitest. Served by nginx in Docker.

## Develop

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # Vitest
npm run lint
npm run build      # static site in ./out (+ CSP hashes in nginx/generated/)
```

## Run in Docker

```bash
docker compose up -d --build   # http://127.0.0.1:8085 (loopback only; set HOST_PORT to change)
```

Deployment behind Cloudflare Tunnel: see [DEPLOY.md](DEPLOY.md).

## Security notes

- `nginx.conf` sends a strict CSP (`default-src 'self'`, `frame-ancestors 'none'`), plus `X-Content-Type-Options`, `Referrer-Policy` and `Permissions-Policy`.
- Next.js emits inline bootstrap scripts, and a static export can't use nonces. `scripts/csp-hashes.mjs` therefore hashes them after each build and nginx allows only those hashes, so `script-src` never needs `'unsafe-inline'`. Styles allow `'unsafe-inline'` because React style attributes and the toast library need it.
- When adding in-browser PDF/OCR parsing later (pdf.js, tesseract.js), you will likely need to add `worker-src 'self' blob:` and `'wasm-unsafe-eval'` to the CSP. Bundle the workers/WASM locally; never load them from a CDN.
