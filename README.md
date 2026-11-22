# Quadrevo

Backend multi-tenant per la fatturazione elettronica italiana e la contabilità in partita doppia, esposto tramite API REST. Il progetto punta a un servizio destinato alla produzione, con particolare attenzione a integrità dei dati, isolamento delle organizzazioni e tracciabilità delle operazioni.

Le specifiche di riferimento sono raccolte nel [documento di progetto Node.js/TypeScript](docs/02-Progetto-A-Quadrevo-Nodejs-TypeScript.md). Questo README riassume il perimetro iniziale e descrive come avviare lo scaffold disponibile.

## Stato attuale

È presente lo scaffold M0: configurazione validata con Zod, server HTTP minimale, timeout e shutdown su `SIGTERM`/`SIGINT`, test unitari e API, Docker Compose e pipeline CI.

L'unico endpoint disponibile è `GET /health`, che restituisce HTTP `200` con `{"status":"ok"}`. Le altre richieste ricevono HTTP `404` in formato Problem Details.

Express, Prisma, autenticazione, persistenza applicativa e funzionalità di business sono previsti nelle milestone successive. PostgreSQL e Mailpit sono già configurati nell'ambiente locale; lo scaffold HTTP non li utilizza ancora.

Il nome del prodotto è **Quadrevo**. Alcuni identificativi dello scaffold usano ancora `ledgerly`: nome del package npm, progetto Compose, database, utente PostgreSQL e tag dell'immagine locale.

## Specifiche funzionali iniziali

Ogni organizzazione costituisce un tenant e gestisce i propri dati:

| Area | Funzionalità previste |
|---|---|
| Identità e accessi | Registrazione, sessioni, refresh token ruotati, ruoli, autorizzazioni e API token con scope |
| Anagrafiche | Clienti e fornitori, dati fiscali italiani, indirizzi e termini di pagamento |
| Contabilità | Piano dei conti, scritture in partita doppia, storni, estratto conto e bilancio di verifica |
| Fatturazione | Bozze, calcolo IVA e totali, numerazione progressiva, finalizzazione, revisioni e note di credito |
| Incassi | Registrazione, allocazioni parziali su più fatture, anticipi cliente e scadenzario |
| Elaborazioni asincrone | Outbox transazionale, coda PostgreSQL, worker, retry e deduplicazione |
| Documenti e integrazioni | PDF, XML FatturaPA, validazione XSD, provider SDI, conservazione, email e webhook firmati |
| Ricorrenze e report | Generazione periodica delle fatture, report IVA a debito e fatturato, esportazione CSV |
| Audit | Registro append-only e catena di hash per rilevare manomissioni |

Il primo rilascio previsto copre il **ciclo attivo B2B/B2C italiano**, incluse fatture e note di credito, invio tramite provider, ricezione degli esiti SDI e conservazione a norma. Il provider deve ancora essere selezionato e sarà isolato tramite porte applicative dedicate.

Ciclo passivo, Pubblica Amministrazione, estero, autofatture, regimi fiscali particolari, multi-valuta e interfaccia web richiedono un perimetro successivo dedicato. Volumi, hosting, obiettivi di disponibilità e procedure operative devono essere definiti prima del rilascio.

## Requisiti di integrità

1. **Bilanciamento contabile:** ogni scrittura deve avere totale dare uguale al totale avere, con verifica applicativa e vincolo o trigger nel database. I saldi derivano dalle righe contabili.
2. **Revisioni immutabili:** i dati fiscali finalizzati e gli XML associati non vengono sovrascritti. Gli scarti consentono revisioni correttive tracciate; le fatture fiscalmente emesse si correggono tramite nota di credito.
3. **Numerazione atomica:** il numero viene assegnato alla prima finalizzazione, con lock nella transazione. Retry e revisioni non consumano nuovi numeri; i documenti numerati non vengono cancellati.
4. **Idempotenza:** i `POST` di business richiedono `Idempotency-Key`; stessa chiave e stesso payload restituiscono la risposta salvata senza duplicare gli effetti. L'autenticazione segue regole dedicate.
5. **Isolamento tenant:** accessi e relazioni sono vincolati a `organization_id`, con enforcement centralizzato e test di accesso tra organizzazioni.
6. **Auditabilità:** gli eventi sono registrati in un log append-only con catena di hash.

Presa in carico del provider, esito SDI, incasso e conservazione mantengono stati separati. Un timeout richiede riconciliazione dello stato remoto prima di procedere con eventuali nuovi invii.

## Stack e architettura

| Area | Base presente | Evoluzione prevista |
|---|---|---|
| Runtime | Node.js `26.13.1`, TypeScript `6.0.3`, ESM e modalità strict | Versioni allineate tra `.nvmrc`, package, Docker e CI |
| HTTP | Server nativo `node:http` | Express, middleware, Problem Details e OpenAPI |
| Validazione e log | Zod, log su stdout/stderr | Pino e request-id |
| Persistenza | PostgreSQL `18.7` in Docker | Prisma ORM 7, adapter PostgreSQL e migrazioni revisionate |
| Importi | Da implementare | `bigint` per centesimi finali, `decimal.js` per calcoli intermedi |
| Qualità | Vitest, ESLint, TypeScript e dependency-cruiser | Test di integrazione, concorrenza e proprietà |
| Servizi locali | Docker Compose e Mailpit | Worker e adapter per le integrazioni |

La composizione delle dipendenze avviene esplicitamente in `src/bootstrap.ts`, tramite constructor injection e factory tipizzate. I confini sono verificati con dependency-cruiser:

- `Domain` contiene entità e invarianti, senza dipendenze dagli altri strati applicativi, da Express o da Prisma.
- `Application` contiene casi d'uso e porte; dipende dal dominio e dalle proprie astrazioni.
- `Infrastructure` implementa persistenza e integrazioni esterne.
- `Interface` espone controller HTTP e comandi console.
- `Kernel` gestisce l'infrastruttura HTTP e i middleware.
- `Support` raccoglie utilità condivise indipendenti dagli strati applicativi.

Le directory sono predisposte nello scaffold; gran parte delle implementazioni deve ancora essere aggiunta. Anche `prisma/` è attualmente vuota.

## Avvio locale con Docker

Servono Docker con supporto a Docker Compose v2 e GNU Make. Eseguire i comandi dalla radice del progetto; Node.js sull'host è facoltativo se si lavora nei container.

Per personalizzare le porte, copiare `.env.example` in `.env` prima dell'avvio. Il file `.env` è facoltativo e non deve essere versionato.

```sh
cp .env.example .env
make build
make npm c="ci"
make infra
make up
curl --fail http://127.0.0.1:3000/health
make check
```

`make npm c="ci"` installa le dipendenze dal lockfile nel volume Linux `node_modules`. `make infra` avvia PostgreSQL e Mailpit; `make up` avvia anche l'applicazione con riavvio automatico tramite `tsx watch` e debugger. Può avviare direttamente tutti e tre i servizi anche senza un precedente `make infra`.

La risposta attesa dell'health check è:

```json
{"status":"ok"}
```

| Servizio | Accesso predefinito dall'host |
|---|---|
| API | `http://127.0.0.1:3000` |
| Debugger Node.js | `127.0.0.1:9229` |
| PostgreSQL | `127.0.0.1:5432` |
| Mailpit, interfaccia web | `http://127.0.0.1:8025` |
| Mailpit, SMTP | `127.0.0.1:1025` |

Le porte pubblicate sono configurabili tramite `APP_PORT`, `DEBUG_PORT`, `POSTGRES_PORT`, `MAILPIT_UI_PORT` e `MAILPIT_SMTP_PORT` in `.env`. Se cambia `APP_PORT`, adeguare l'URL dell'health check.

PostgreSQL usa le credenziali locali `ledgerly` / `ledgerly`. Il database di sviluppo è `ledgerly`; `ledgerly_test` viene creato dallo script di inizializzazione per i futuri test su database reale. Lo script viene eseguito soltanto alla prima inizializzazione del volume `pgdata`.

Nel container, le connessioni usano i nomi dei servizi `postgres` e `mailpit`. Docker Compose imposta già `DATABASE_URL`, `DATABASE_URL_TEST`, `SMTP_HOST` e `SMTP_PORT`.

## Comandi di sviluppo

| Comando | Scopo |
|---|---|
| `make help` | Elenca i comandi disponibili |
| `make logs` | Segue i log dei servizi |
| `make shell` | Apre una shell nel container dell'applicazione |
| `make test` | Esegue i test Vitest |
| `make lint` | Esegue ESLint |
| `make typecheck` | Verifica i tipi TypeScript |
| `make check` | Esegue typecheck, lint, confini delle dipendenze e test con coverage |
| `make psql` / `make psql-test` | Apre la console del database di sviluppo o di test |
| `make npm c="run build"` | Compila TypeScript in `dist/` |
| `make prod-image` | Costruisce l'immagine di produzione `ledgerly:local` |
| `make down` | Ferma i servizi conservando i volumi |
| `make reset` | Ferma i servizi e cancella i volumi, inclusi database e dipendenze |

In alternativa, con la versione Node.js indicata in `.nvmrc`, è possibile eseguire sull'host `npm ci`, `npm run dev` e `npm run check`. L'avvio diretto con Node.js richiede che le variabili d'ambiente siano già impostate nella shell: lo scaffold non carica automaticamente `.env`. Per le future connessioni al database dall'host, usare `localhost` e la porta pubblicata.

La configurazione HTTP attuale accetta `NODE_ENV` (`development`, `test`, `production`), `HOST` (default `0.0.0.0`), `PORT` (default `3000`) e `SHUTDOWN_TIMEOUT_MS` (default `10000`).

## Verifiche e sviluppo previsto

La suite attuale copre la configurazione e il comportamento HTTP di `/health` e delle route sconosciute. La CI esegue installazione dal lockfile, typecheck, lint, controllo delle dipendenze, test con coverage, build TypeScript, audit npm e build dell'immagine di produzione.

La strategia prevista aggiunge test su PostgreSQL reale per transazioni, migrazioni, lock e vincoli; test API per permessi, isolamento tenant e idempotenza; test concorrenti per numerazione e incassi; test di contratto per SDI e conservazione. L'obiettivo di coverage è almeno l'85% su `Domain/` e `Application/` una volta implementati.

La roadmap procede da M0 (fondamenta) a M1 (HTTP), M2 (persistenza), M3 (identità e tenant), M4 (anagrafiche), M5 (contabilità), M6 (fatturazione), M7 (incassi), M8 (asincrono), M9 (SDI e conservazione), M10 (ricorrenze e report) e M11 (sicurezza e audit). La preparazione al rilascio M12 sarà analizzata separatamente.

Il flusso previsto usa un branch e una PR per task, Conventional Commits, controlli CI e squash merge. La configurazione delle protezioni GitHub fa parte delle attività iniziali ancora da completare. Le nuove dipendenze devono essere concordate prima dell'introduzione.

## Documentazione

- [Specifiche Node.js/TypeScript](docs/02-Progetto-A-Quadrevo-Nodejs-TypeScript.md): dominio, architettura, persistenza, API, ciclo SDI e criteri di rilascio.
- [Task list M0–M11](docs/03-Task-List-M0-M11.md): dipendenze, convenzioni e criteri di completamento dei task.
- [Documento PHP originale](docs/02-Progetto-A-Quadrevo-PHP-Vanilla.md): riferimento storico; la variante corrente segue le specifiche Node.js/TypeScript.
