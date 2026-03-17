.PHONY: app\:bootstrap app\:dev app\:build app\:preview app\:lint app\:build-all

app\:bootstrap: ## Install root and worker dependencies
	npm ci
	npm --prefix $(WORKER_DIR) ci

app\:dev: ## Start the Vite dev server
	npm exec -- vite

app\:build: ## Build the Vite app
	npm exec -- tsc -b
	npm exec -- vite build

app\:preview: ## Preview the production app
	npm exec -- vite preview

app\:lint: ## Run ESLint
	npm exec -- eslint .

app\:build-all: app\:build worker\:build ## Build the app and worker
