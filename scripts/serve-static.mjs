// Static file server for dev — replaces the shadow-cljs :dev-http
// server that used to host the app on :3001 for Electron/web dev.
// Usage: node scripts/serve-static.mjs [port]
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { join, extname, normalize, resolve } from 'node:path'

const port = Number(process.argv[2]) || 3001
const root = resolve('static')

const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.wasm': 'application/wasm',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.map': 'application/json',
}

createServer(async (req, res) => {
  try {
    const url = decodeURIComponent(new URL(req.url, 'http://x').pathname)
    let file = normalize(join(root, url === '/' ? 'index.html' : url))
    if (!file.startsWith(root)) {
      res.writeHead(403).end()
      return
    }
    const body = await readFile(file)
    res.writeHead(200, {
      'content-type': types[extname(file)] || 'application/octet-stream',
      // dev server: always revalidate so code/css edits can't be masked
      // by heuristic caching in the persistent parity profiles
      'cache-control': 'no-store',
    })
    res.end(body)
  } catch {
    res.writeHead(404).end()
  }
}).listen(port, () => console.log(`serving static/ on http://localhost:${port}`))
