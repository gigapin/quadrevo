# Repository Guidelines

## Mandatory Agent Rules

- Keep code comments and branch names independent of internal planning documents. Never include milestone or task IDs, document-specific abbreviations, or section references. Describe the behavior or purpose directly; use branches such as `feat/http-context-validation`. Planning identifiers belong only in local planning documents.
- Only the user may create commits or push changes. Never run commit or push operations on the user's behalf.
- Use Italian only when communicating with the user in this terminal. All code and repository content, including comments, messages, documentation, commit messages, and PR text, must be in English. The sole exception is `docs/`: it is ignored by Git, remains local, and may contain Italian. Do not add it to the public repository.
- Never install libraries or extensions without the user's explicit consent. This includes dependency installation commands such as `npm install` and `npm ci`, whether run on the host or inside a container. The setup commands below describe available workflows and do not grant installation permission.

## Project Structure & Module Organization

Quadrevo provides an initial TypeScript scaffold; only `GET /health` is implemented. Express, Prisma, and business features are planned.

- `src/server.ts`: HTTP startup and shutdown; `src/bootstrap.ts`: validated configuration and composition root.
- `src/Kernel/`: HTTP infrastructure. Planned layers include `Domain`, `Application`, `Infrastructure`, `Interface`, and `Support`; empty directories may be absent from Git.
- `tests/Unit/` and `tests/Api/`: existing tests. Database initialization lives in `docker/postgres/init/`; CI lives in `.github/workflows/ci.yml`.
- `dist/`, `coverage/`, and local planning documents in `docs/` are ignored. No frontend assets.

Keep Domain independent of frameworks and other application layers. Application depends on Domain and its own ports; adapters implement those ports. Check boundaries with dependency-cruiser.

## Build, Test, and Development Commands

Use Docker Compose v2 and Make, or the Node.js version in `.nvmrc`.

- `make build`: build the development image.
- `make npm c="ci"`: install locked dependencies in the container.
- `make infra`: start PostgreSQL and Mailpit; `make up`: start all services.
- `make test`: run Vitest; `make check`: run typecheck, ESLint, dependency checks, and coverage.
- `make npm c="run build"`: compile to `dist/`; `make prod-image`: build the production image.

For host development, use `npm ci`, `npm run dev`, and `npm run check`.

## Coding Style & Naming Conventions

Write repository content, comments, messages, commits, and PRs in English. Follow existing two-space indentation, single quotes, and semicolons. Use strict TypeScript, ESM imports with `.js` relative extensions, and explicit type imports. Match PascalCase class/module names and camelCase functions/variables. Validate external input with Zod. ESLint enforces typed rules; agree on new dependencies before adding them.

## Testing Guidelines

Name Vitest files `*.test.ts` under `tests/`. API tests use a real HTTP server on an ephemeral port. Add behavior-focused tests for functional changes. Coverage thresholds require 85% for lines, functions, branches, and statements in Domain and Application. Future persistence tests should use real PostgreSQL for constraints and concurrency.

## Commit & Pull Request Guidelines

History includes: `first commit` and a `docs:` commit. Follow the documented Conventional Commits workflow, for example `feat(http): add request validation`, with branches such as `feat/http-context-validation`. Keep one task per PR; describe the functional goal, explain behavior changes, provide validation results, and link relevant decisions. Run `make check` and require passing CI before squash merge.

## Configuration

Copy `.env.example` to `.env` for local overrides; never commit secrets. Host execution does not automatically load `.env`. `make reset` deletes database and dependency volumes.
