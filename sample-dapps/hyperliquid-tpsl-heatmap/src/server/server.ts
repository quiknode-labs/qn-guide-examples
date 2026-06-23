import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';
import { loadConfig } from './config';
import { ClusterStore } from './cluster-store';
import { startDemoFeed } from './demo';
import { startLiveStreams } from './streams';
import { RunMode } from '../shared/types';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const config = loadConfig();
const mode: RunMode = config.demoMode ? 'demo' : 'live';
const store = new ClusterStore(config.coins, config.defaultCoin, config.bucketSizePct);

let latestStatus = config.demoMode
  ? config.explicitDemoMode
    ? 'Demo feed requested'
    : 'Demo feed running because credentials are missing'
  : 'Connecting to Quicknode gRPC streams';

const vite = process.env.NODE_ENV === 'production'
  ? null
  : await import('vite').then((mod) =>
      mod.createServer({
        root: rootDir,
        server: { middlewareMode: true },
        appType: 'spa',
      })
    );

const server = http.createServer(async (req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: true, mode, status: latestStatus }));
    return;
  }

  if (vite) {
    vite.middlewares(req, res, () => sendNotFound(res));
    return;
  }

  serveStatic(req, res);
});

const wss = new WebSocketServer({ server, path: '/ws' });

function broadcast(status = latestStatus) {
  latestStatus = status;
  const state = JSON.stringify(store.toClientState(mode, latestStatus));
  for (const client of wss.clients) {
    if (client.readyState === client.OPEN) client.send(state);
  }
}

wss.on('connection', (socket) => {
  socket.send(JSON.stringify(store.toClientState(mode, latestStatus)));
});

if (config.demoMode) {
  startDemoFeed(config.coins, store, broadcast);
} else {
  startLiveStreams(config, store, broadcast);
}

server.listen(config.port, () => {
  console.log(`hyperliquid-tpsl-heatmap listening on http://localhost:${config.port}`);
  console.log(`Mode: ${mode} | Coins: ${config.coins.join(', ')}`);
});

function serveStatic(req: http.IncomingMessage, res: http.ServerResponse): void {
  const distDir = path.join(rootDir, 'dist');
  const requestedPath = decodeURIComponent(new URL(req.url || '/', `http://localhost`).pathname);
  const filePath = requestedPath === '/' ? path.join(distDir, 'index.html') : path.join(distDir, requestedPath);
  const safePath = filePath.startsWith(distDir) && fs.existsSync(filePath) && fs.statSync(filePath).isFile()
    ? filePath
    : path.join(distDir, 'index.html');

  fs.readFile(safePath, (err, data) => {
    if (err) {
      sendNotFound(res);
      return;
    }
    res.writeHead(200, { 'content-type': contentType(safePath) });
    res.end(data);
  });
}

function contentType(filePath: string): string {
  if (filePath.endsWith('.html')) return 'text/html';
  if (filePath.endsWith('.js')) return 'text/javascript';
  if (filePath.endsWith('.css')) return 'text/css';
  if (filePath.endsWith('.svg')) return 'image/svg+xml';
  return 'application/octet-stream';
}

function sendNotFound(res: http.ServerResponse): void {
  res.writeHead(404, { 'content-type': 'text/plain' });
  res.end('Not found');
}
