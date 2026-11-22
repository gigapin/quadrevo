import { createServer, type Server } from 'node:http';

/**
 * Minimal HTTP server providing a health check.
 * Planned replacement: ExpressApp + Routes with Problem Details.
 */
export function createHttpServer(): Server {
  const server = createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/health') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok' }));
      return;
    }
    res.writeHead(404, { 'content-type': 'application/problem+json' });
    res.end(JSON.stringify({ type: 'about:blank', title: 'Not Found', status: 404 }));
  });

  // Explicit HTTP timeouts.
  server.requestTimeout = 30_000;
  server.headersTimeout = 10_000;
  server.keepAliveTimeout = 5_000;
  return server;
}
