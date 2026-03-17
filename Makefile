SHELL := bash
.DEFAULT_GOAL := help

WORKER_DIR := workers/image-converter
SUPABASE_PROJECT_ID := lzgryhrztslevnuajiqm
TEST_FLAGS ?=
EDGE_DEBUG ?=
NO_JWT ?=
UPLOAD_IMAGE_INTEGRATION_TEST := supabase/functions/tests/upload-image-files.integration.test.ts

.PHONY: help bootstrap dev build preview lint worker-build worker-test worker-typecheck build-all test-all test-quick test-integration test-upload-image-integration verify verify-full types schema-remote schema-local data-remote data-local db-reset

help: ## List available targets
	@grep -E '^[a-zA-Z0-9_.-]+:.*?## ' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "%-18s %s\n", $$1, $$2}'

bootstrap: ## Install root and worker dependencies
	npm ci
	npm --prefix $(WORKER_DIR) ci

dev: ## Start the Vite dev server
	npm exec -- vite

build: ## Build the Vite app
	npm exec -- tsc -b
	npm exec -- vite build

preview: ## Preview the production app
	npm exec -- vite preview

lint: ## Run ESLint
	npm exec -- eslint .

worker-build: ## Build the image conversion worker
	npm --prefix $(WORKER_DIR) run build

worker-test: ## Run the image conversion worker tests
	npm --prefix $(WORKER_DIR) run test

worker-typecheck: ## Type-check the image conversion worker
	npm --prefix $(WORKER_DIR) run typecheck

build-all: build worker-build ## Build the app and worker

test-all: ## Run the full test orchestrator; pass TEST_FLAGS='...', EDGE_DEBUG='true|false', NO_JWT='true'
	EDGE_DEBUG=$(EDGE_DEBUG) NO_JWT=$(NO_JWT) node --env-file-if-exists=.env.test.local --import tsx ./scripts/test-all.ts $(TEST_FLAGS)

test-quick: ## Run the test orchestrator without integration boot
	EDGE_DEBUG=$(EDGE_DEBUG) NO_JWT=$(NO_JWT) node --env-file-if-exists=.env.test.local --import tsx ./scripts/test-all.ts --skip-integration

test-integration: ## Run integration tests only; pass EDGE_DEBUG='true|false', NO_JWT='true'
	EDGE_DEBUG=$(EDGE_DEBUG) NO_JWT=$(NO_JWT) node --env-file-if-exists=.env.test.local --import tsx ./scripts/test-all.ts --integration-only

test-upload-image-integration: ## Run only the upload-image-files integration test; pass TEST_FLAGS='...', EDGE_DEBUG='true|false', NO_JWT='true'
	EDGE_DEBUG=$(EDGE_DEBUG) NO_JWT=$(NO_JWT) SUPABASE_INTEGRATION_GLOB=$(UPLOAD_IMAGE_INTEGRATION_TEST) node --env-file-if-exists=.env.test.local --import tsx ./scripts/test-all.ts --integration-only $(TEST_FLAGS)

verify: lint build worker-typecheck test-quick ## Run a fast local verification pass

verify-full: lint build worker-typecheck test-all ## Run the full local verification pass

types: ## Generate Supabase TypeScript types
	supabase gen types typescript --project-id $(SUPABASE_PROJECT_ID) --schema public > src/lib/database.types.ts

schema-remote: ## Dump the remote public schema
	supabase db dump --schema public -f supabase/schema.sql

schema-local: ## Dump the local public schema
	supabase db dump --schema public --local -f supabase/schema.sql

data-remote: ## Dump the remote public data
	supabase db dump --linked --schema public --data-only -f supabase/data.sql

data-local: ## Dump the local public data
	supabase db dump --linked --schema public --local --data-only -f supabase/data.sql

db-reset: ## Reset the local database from checked-in schema and data
	bash ./scripts/db_reset.sh supabase
