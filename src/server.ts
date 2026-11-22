import type { AddressInfo } from 'node:net';
import { loadConfig } from './bootstrap.js';
import { createHttpServer } from './Kernel/HttpServer.js';

// Log to stdout/stderr until structured logging is introduced.
/* eslint-disable no-console */

const config = loadConfig(process.env);
const server = createHttpServer();

server.listen(config.http.port, config.http.host, () => {
  const { address, port } = server.address() as AddressInfo;
  console.log(`quadrevo listening on http://${address}:${String(port)} (${config.env})`);
});

let shuttingDown = false;

function shutdown(signal: NodeJS.Signals): void {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`${signal} received, shutting down`);

  const deadline = setTimeout(() => {
    console.error(`Shutdown did not complete within ${String(config.shutdownTimeoutMs)} ms, forcing exit`);
    process.exit(1);
  }, config.shutdownTimeoutMs);
  deadline.unref();

  // Stop accepting connections and wait for in-flight requests.
  server.close((error) => {
    if (error) {
      console.error('Error shutting down the HTTP server', error);
      process.exit(1);
    }
    process.exit(0);
  });
  server.closeIdleConnections();
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
