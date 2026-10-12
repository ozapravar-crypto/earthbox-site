// Tiny static file server for the QA runs: in-process (nothing to kill
// afterwards), parallel-safe, and supports byte ranges for the home film.
// Python's http.server (listen backlog 5) stalled under parallel browsers.
import http from 'node:http';
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png',
  '.mp4': 'video/mp4', '.glb': 'model/gltf-binary', '.xml': 'application/xml', '.txt': 'text/plain', '.ico': 'image/x-icon' };

// The site-wide headers from vercel.json (CSP etc.), so local tests run under
// the same rules as production: a script the CSP blocks fails here too.
const SITE_HEADERS = (() => {
  try {
    const cfg = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
    return (cfg.headers.find(h => h.source === '/(.*)')?.headers || []).filter(h => h.key !== 'Strict-Transport-Security').map(h => [h.key, h.value]);
  } catch { return []; }
})();

export function serve(root, port){
  const server = http.createServer((req, res) => {
    const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let file = path.join(root, rel.endsWith('/') ? rel + 'index.html' : rel);
    // Clean URLs, as on Vercel (cleanUrls in vercel.json): /about → about.html.
    // A page beats a same-named folder: /blog is blog.html, not the blog/ folder of articles.
    if (!rel.endsWith('/') && !path.extname(file) && existsSync(`${file}.html`)) file += '.html';
    if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
    let st;
    try { st = statSync(file); if (st.isDirectory()) { file = path.join(file, 'index.html'); st = statSync(file); } }
    catch {
      // Unknown page → the site's own 404.html with a 404 status, as Vercel does.
      const nf = path.join(root, '404.html');
      if (!path.extname(rel) && existsSync(nf)) { res.writeHead(404, { 'content-type': TYPES['.html'] }); createReadStream(nf).pipe(res); return; }
      res.writeHead(404, { 'content-type': 'text/plain' }).end('not found'); return;
    }
    const type = TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream';
    for (const [k, val] of SITE_HEADERS) res.setHeader(k, val);   // same security headers as Vercel
    const m = /bytes=(\d*)-(\d*)/.exec(req.headers.range || '');
    if (m) {
      const start = m[1] ? +m[1] : 0, end = m[2] ? Math.min(+m[2], st.size - 1) : st.size - 1;
      res.writeHead(206, { 'content-type': type, 'content-range': `bytes ${start}-${end}/${st.size}`, 'accept-ranges': 'bytes', 'content-length': end - start + 1 });
      createReadStream(file, { start, end }).on('error', () => res.destroy()).pipe(res);
    } else {
      res.writeHead(200, { 'content-type': type, 'content-length': st.size, 'accept-ranges': 'bytes' });
      createReadStream(file).on('error', () => res.destroy()).pipe(res);   // a failed read drops one response, not the server
    }
  });
  return new Promise(r => server.listen(port, () => r(server)));
}
