.PHONY: worker\:build worker\:test worker\:typecheck

worker\:build: ## Build the image conversion worker
	npm --prefix $(WORKER_DIR) run build

worker\:test: ## Run the image conversion worker tests
	npm --prefix $(WORKER_DIR) run test

worker\:typecheck: ## Type-check the image conversion worker
	npm --prefix $(WORKER_DIR) run typecheck
