// `node qa/serve-cli.mjs [port]` — the QA static server as a command, for
// Playwright's webServer (replaces python's http.server, which stalled
// under parallel test workers).
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve } from './serve.mjs';

// `node qa/serve-cli.mjs [port] [folder]`: folder defaults to the repo; tests serve dist/ (what goes live).
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = +(process.argv[2] || 4173);
const root = path.resolve(repo, process.argv[3] || '.');
await serve(root, port);
console.log(`serving ${root} on http://localhost:${port}`);
