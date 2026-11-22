import type { AddressInfo } from 'node:net';
import { loadConfig } from './bootstrap.js';
import { createHttpServer } from './Kernel/HttpServer.js';

// Log to stdout/stderr until Pino is introduced in M1.
/* eslint-disable no-console */

const config = loadConfig(process.env);
const server = createHttpServer();

server.listen(config.http.port, config.http.host, () => {
  const { address, port } = server.address() as AddressInfo;
  console.log(`ledgerly listening on http://${address}:${String(port)} (${config.env})`);
});

let shuttingDown = false;

function shutdown(signal: NodeJS.Signals): void {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`${signal} ricevuto, chiusura in corso`);

  const deadline = setTimeout(() => {
    console.error(`Chiusura non completata entro ${String(config.shutdownTimeoutMs)} ms, uscita forzata`);
    process.exit(1);
  }, config.shutdownTimeoutMs);
  deadline.unref();

  // Stop accepting connections and wait for in-flight requests.
  server.close((error) => {
    if (error) {
      console.error('Errore in chiusura del server HTTP', error);
      process.exit(1);
    }
    process.exit(0);
  });
  server.closeIdleConnections();
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
