COMPOSE := docker compose
RUN     := $(COMPOSE) run --rm app

.DEFAULT_GOAL := help
.PHONY: help build up infra down logs shell install npm test lint typecheck check psql psql-test reset prod-image

help: ## Show available commands
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

build: ## Build the development image
	$(COMPOSE) build app

up: ## Start the app, PostgreSQL, and Mailpit
	$(COMPOSE) up -d

infra: ## Start only PostgreSQL and Mailpit
	$(COMPOSE) up -d postgres mailpit

down: ## Stop containers (data remains in volumes)
	$(COMPOSE) down

logs: ## Follow logs from all services
	$(COMPOSE) logs -f

shell: ## Open a shell in the app container
	$(RUN) bash

install: ## npm install in the container (Linux node_modules)
	$(RUN) npm install

npm: ## Run an npm command: make npm c="install express"
	$(RUN) npm $(c)

test: ## Run tests in the container
	$(RUN) npm test

lint: ## ESLint in the container
	$(RUN) npm run lint

typecheck: ## tsc --noEmit in the container
	$(RUN) npm run typecheck

check: ## typecheck + lint + dependency boundaries + tests with coverage (same as CI)
	$(RUN) npm run check

psql: ## psql console for the development database
	$(COMPOSE) exec postgres psql -U quadrevo -d quadrevo

psql-test: ## psql console for the test database
	$(COMPOSE) exec postgres psql -U quadrevo -d quadrevo_test

reset: ## Stop everything and delete volumes (databases and node_modules)
	$(COMPOSE) down -v

prod-image: ## Build the production image
	docker build --target prod -t quadrevo:local .
