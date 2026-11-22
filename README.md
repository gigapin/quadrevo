# Quadrevo

A multi-tenant backend for Italian electronic invoicing and double-entry accounting, exposed through a REST API. The project aims to deliver a production service with a focus on data integrity, organization isolation, and traceable operations.

This README summarizes the initial scope and explains how to run the available scaffold.

## Current status

The initial scaffold includes configuration validation with Zod, a minimal HTTP server, timeouts and shutdown handling for `SIGTERM`/`SIGINT`, unit and API tests, Docker Compose, and a CI pipeline.

The only available endpoint is `GET /health`, which returns HTTP `200` with `{"status":"ok"}`. Other requests receive HTTP `404` in Problem Details format.

Express, Prisma, authentication, application persistence, and business features are planned for later milestones. PostgreSQL and Mailpit are already configured for local development; the HTTP scaffold does not use them yet.

The npm package, PostgreSQL user, and development database are named `quadrevo`; the test database is `quadrevo_test`. Docker Compose uses the project name `quadrevo-ts`, and local images use the `quadrevo` tag prefix.

## Initial functional scope

Each organization is a tenant and manages its own data:

| Area | Planned features |
|---|---|
| Identity and access | Registration, sessions, rotated refresh tokens, roles, permissions, and scoped API tokens |
| Contacts | Customers and suppliers, Italian tax details, addresses, and payment terms |
| Accounting | Chart of accounts, double-entry postings, reversals, account statements, and trial balance |
| Invoicing | Drafts, VAT and total calculations, sequential numbering, finalization, revisions, and credit notes |
| Payments | Recording receipts, partial allocations across invoices, customer advances, and aging reports |
| Background processing | Transactional outbox, PostgreSQL job queue, workers, retries, and deduplication |
| Documents and integrations | PDF, FatturaPA XML, XSD validation, SDI provider, statutory document preservation, email, and signed webhooks |
| Recurring invoices and reports | Scheduled invoice generation, output VAT and revenue reports, and CSV exports |
| Audit | Append-only records and a hash chain to detect tampering |

The planned first release covers **outgoing Italian B2B/B2C invoices and credit notes**, including submission through a provider, receipt of SDI outcomes, and statutory document preservation. The provider has yet to be selected and will be isolated behind dedicated application ports.

Incoming supplier invoices, public administration invoicing, cross-border transactions, self-invoicing, special tax regimes, multiple currencies, and a web interface require a separate future scope. Workload estimates, hosting, availability targets, and operating procedures must be defined before release.

## Integrity requirements

1. **Balanced entries:** total debits must equal total credits for every journal entry, enforced by application checks and a database constraint or trigger. Account balances are derived from journal lines.
2. **Immutable revisions:** finalized tax data and associated XML files must not be overwritten. Rejected invoices allow traceable corrective revisions; invoices confirmed as issued are corrected through credit notes.
3. **Atomic numbering:** a number is assigned at first finalization using a lock within the transaction. Retries and revisions do not consume new numbers; numbered documents are never deleted.
4. **Idempotency:** business `POST` requests require an `Idempotency-Key`; the same key and payload return the saved response without duplicating effects. Authentication follows dedicated rules.
5. **Tenant isolation:** access and relationships are scoped to `organization_id`, with centralized enforcement and tests for access across organizations.
6. **Auditability:** events are recorded in an append-only log with a hash chain.

Provider acceptance, SDI outcomes, payment, and preservation have separate states. A timeout requires reconciliation with the remote state before any further submission is attempted.

## Stack and architecture

| Area | Current foundation | Planned evolution |
|---|---|---|
| Runtime | Node.js `26.13.1`, TypeScript `6.0.3`, ESM, and strict mode | Versions kept aligned across `.nvmrc`, package metadata, Docker, and CI |
| HTTP | Native `node:http` server | Express, middleware, Problem Details, and OpenAPI |
| Validation and logging | Zod and stdout/stderr logging | Pino and request IDs |
| Persistence | PostgreSQL `18.7` in Docker | Prisma ORM 7, PostgreSQL adapter, and reviewed migrations |
| Monetary values | Pending implementation | `bigint` for final amounts in cents, `decimal.js` for intermediate calculations |
| Quality | Vitest, ESLint, TypeScript, and dependency-cruiser | Integration, concurrency, and property-based tests |
| Local services | Docker Compose and Mailpit | Workers and integration adapters |

Dependencies are composed explicitly in `src/bootstrap.ts` through constructor injection and typed factories. Boundaries are checked with dependency-cruiser:

- `Domain` contains entities and invariants, independent of other application layers, Express, and Prisma.
- `Application` contains use cases and ports; it depends on the domain and its own abstractions.
- `Infrastructure` implements persistence and external integrations.
- `Interface` exposes HTTP controllers and console commands.
- `Kernel` manages HTTP infrastructure and middleware.
- `Support` provides shared utilities independent of application layers.

Most of these layers still await implementation. Empty scaffold directories, including `prisma/`, may be absent from a fresh Git checkout.

### Repository layout

| Path | Responsibility |
|---|---|
| `src/server.ts` | HTTP startup and graceful shutdown |
| `src/bootstrap.ts` | Environment validation and dependency composition |
| `src/Kernel/HttpServer.ts` | Current health endpoint and fallback responses |
| `tests/Unit/` | Configuration tests |
| `tests/Api/` | HTTP tests against an ephemeral local server |
| `docker/postgres/init/` | Test database initialization |
| `.github/` | CI workflow and pull request template |
| `dist/`, `coverage/`, `node_modules/` | Generated output and dependencies, excluded from Git |

## Local setup with Docker

Docker with Docker Compose v2 support, GNU Make, Git, and curl are required. Start the Docker daemon before running the setup. Node.js on the host is optional when working in containers.

Clone the repository and enter its root directory:

```sh
git clone https://github.com/gigapin/quadrevo.git
cd quadrevo
```

For a first checkout, run the following commands. Copy `.env.example` only if `.env` does not already exist; adjust conflicting ports before starting services. The `.env` file is optional and must not be committed.

```sh
cp .env.example .env
make build
make npm c="ci"
make infra
make up
curl --fail http://127.0.0.1:3000/health
make check
```

`make npm c="ci"` installs dependencies from the lockfile into the Linux `node_modules` volume. `make infra` starts PostgreSQL and Mailpit; `make up` also starts the application with automatic restarts through `tsx watch` and the debugger enabled. It can start all three services directly without a preceding `make infra`.

The expected health check response is:

```json
{"status":"ok"}
```

`make up` starts services in the background. Check readiness with `docker compose ps`; retry the health check after the application starts. Use `make logs` to inspect startup errors. A successful `make check` confirms that type checks, lint, architectural boundaries, and the current test suite pass.

| Service | Default host access |
|---|---|
| API | `http://127.0.0.1:3000` |
| Node.js debugger | `127.0.0.1:9229` |
| PostgreSQL | `127.0.0.1:5432` |
| Mailpit web interface | `http://127.0.0.1:8025` |
| Mailpit SMTP | `127.0.0.1:1025` |

Published ports can be configured through `APP_PORT`, `DEBUG_PORT`, `POSTGRES_PORT`, `MAILPIT_UI_PORT`, and `MAILPIT_SMTP_PORT` in `.env`. If `APP_PORT` changes, update the health check URL accordingly.

PostgreSQL uses the local credentials `quadrevo` / `quadrevo`. The development database is `quadrevo`; the initialization script creates `quadrevo_test` for future tests against a real database. This script runs only when the `pgdata` volume is first initialized.

Renaming the Compose project creates a separate namespace for containers, networks, and volumes. Existing volumes from the previous project remain untouched and are not automatically migrated. The new database names and user apply when initializing a fresh PostgreSQL volume; changing environment variables does not rename databases or roles in an existing volume.

Inside containers, connections use the service names `postgres` and `mailpit`. Docker Compose already sets `DATABASE_URL`, `DATABASE_URL_TEST`, `SMTP_HOST`, and `SMTP_PORT`.

### Troubleshooting

- **Docker connection errors:** start Docker and verify that `docker compose version` works.
- **Port already allocated:** change the corresponding host port in `.env`, then run `make up` again.
- **Missing `tsx` or test tools:** run `make npm c="ci"` to populate the dependency volume. Run it again after dependency or lockfile changes.
- **Database missing after configuration changes:** initialization scripts run only for a fresh volume. Inspect with `make psql` or `make psql-test`; preserve existing data before considering a reset.
- **Stopping development:** use `make down` to preserve data. `make reset` deletes both database and dependency volumes; after an intentional reset, repeat dependency installation and startup.

## Development commands

| Command | Purpose |
|---|---|
| `make help` | List available commands |
| `make logs` | Follow service logs |
| `make shell` | Open a shell in the application container |
| `make test` | Run Vitest tests |
| `make lint` | Run ESLint |
| `make typecheck` | Check TypeScript types |
| `make check` | Run type checks, lint, dependency boundary checks, and tests with coverage |
| `make psql` / `make psql-test` | Open the development or test database console |
| `make npm c="run build"` | Compile TypeScript into `dist/` |
| `make prod-image` | Build the production image as `quadrevo:local` |
| `make down` | Stop services while preserving volumes |
| `make reset` | Stop services and delete volumes, including databases and dependencies |

Alternatively, with the Node.js version specified in `.nvmrc`, run `npm ci`, `npm run dev`, and `npm run check` on the host. Running Node.js directly requires environment variables to be set in the shell: the scaffold does not automatically load `.env`. For future database connections from the host, use `localhost` and the published port.

The current HTTP configuration accepts `NODE_ENV` (`development`, `test`, `production`), `HOST` (default `0.0.0.0`), `PORT` (default `3000`), and `SHUTDOWN_TIMEOUT_MS` (default `10000`).

## Validation and roadmap

The current suite covers configuration and HTTP behavior for `/health` and unknown routes. CI runs installation from the lockfile, type checks, lint, dependency checks, tests with coverage, the TypeScript build, npm audit, and the production image build.

The planned strategy adds tests against real PostgreSQL for transactions, migrations, locks, and constraints; API tests for permissions, tenant isolation, and idempotency; concurrency tests for numbering and payments; and contract tests for SDI and preservation. The coverage target is at least 85% for `Domain/` and `Application/` once implemented.

Development proceeds from HTTP and persistence to identity and tenant isolation, contacts, accounting, invoicing, payments, background processing, SDI and preservation, recurring invoices and reports, and security and audit. Release preparation will be planned separately.

The workflow uses one branch and pull request per functional goal, Conventional Commits, CI checks, and squash merges. New dependencies must be agreed upon before introduction. All repository content, code comments, commit messages, and pull request text must be written in English.

## Pull requests and branch protection

Use descriptive branch names such as `chore/github-workflow` and commit messages such as `chore(ci): configure pull request checks`. Keep branch names and code comments independent of internal planning identifiers. Only the repository owner creates commits and pushes changes.

Pull requests targeting `main` use the [PR template](.github/pull_request_template.md). Describe the functional goal, changes, and validation results, then complete the definition-of-done checklist. Run `make check` before submitting changes.

The repository requires the following GitHub settings:

- `main` requires a pull request, including for administrators; direct pushes, force pushes, and branch deletion are prohibited.
- The GitHub Actions checks `check` and `docker` must pass. Branches must be up to date with `main` before merging.
- No minimum approval count is configured, allowing the owner to work alone; pull requests and required checks remain mandatory.
- Squash merge is the only enabled merge method. GitHub automatically deletes merged head branches.

Repository administrators can inspect these settings under **Settings → Branches → main** and **Settings → General → Pull Requests**. After pushing a feature branch, verify that its PR lists both checks as required and enables merging only after they pass.

## Project specifications

Detailed planning documents are maintained locally under `docs/`, which is currently excluded from version control. They are not included in a GitHub checkout. The Node.js/TypeScript specification is the reference for this implementation; the original PHP proposal is retained locally as historical context.

### Architecture decisions

The initial decisions are summarized here so that a fresh checkout remains self-contained:

- **Express, Prisma, and PostgreSQL:** use established HTTP and persistence tools while retaining business invariants and transaction boundaries in application code and the database. Keep framework and ORM types outside Domain and Application. Express and Prisma integration is planned; PostgreSQL is already configured.
- **Node.js 26 and TypeScript 6:** keep the runtime aligned across `.nvmrc`, package engines, Docker, and CI. Use strict TypeScript with ESM/NodeNext and the committed lockfile. Defer a compiler major upgrade until the lint toolchain supports the selected release and repository checks pass together.
- **One branch and PR per functional goal:** use descriptive English names, Conventional Commits with optional functional scopes, required CI checks, and squash merge. Only the owner creates commits and pushes; internal planning identifiers stay out of branch names and code comments.

Full Architecture Decision Records (ADRs) are maintained locally with **Context**, **Decision**, and **Consequences** sections:

- `docs/adr/0001-express-prisma-postgresql.md`
- `docs/adr/0002-node-26-typescript-6.md`
- `docs/adr/0003-branch-per-task-workflow.md`

These paths describe local records, not files available through GitHub. See [Repository Guidelines](AGENTS.md) for contributor rules and the [pull request template](.github/pull_request_template.md) for review requirements.
