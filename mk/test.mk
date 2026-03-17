.PHONY: test\:all test\:quick test\:integration test\:upload-image-integration test\:verify test\:verify-full

test\:all: ## Run the full test orchestrator; pass TEST_FLAGS='...', EDGE_DEBUG='true|false', NO_JWT='true'
	EDGE_DEBUG=$(EDGE_DEBUG) NO_JWT=$(NO_JWT) node --env-file-if-exists=.env.test.local --import tsx ./scripts/test-all.ts $(TEST_FLAGS)

test\:quick: ## Run the test orchestrator without integration boot
	EDGE_DEBUG=$(EDGE_DEBUG) NO_JWT=$(NO_JWT) node --env-file-if-exists=.env.test.local --import tsx ./scripts/test-all.ts --skip-integration

test\:integration: ## Run integration tests only; pass EDGE_DEBUG='true|false', NO_JWT='true'
	EDGE_DEBUG=$(EDGE_DEBUG) NO_JWT=$(NO_JWT) node --env-file-if-exists=.env.test.local --import tsx ./scripts/test-all.ts --integration-only

test\:upload-image-integration: ## Run only the upload-image-files integration test; pass TEST_FLAGS='...', EDGE_DEBUG='true|false', NO_JWT='true'
	EDGE_DEBUG=$(EDGE_DEBUG) NO_JWT=$(NO_JWT) SUPABASE_INTEGRATION_GLOB=$(UPLOAD_IMAGE_INTEGRATION_TEST) node --env-file-if-exists=.env.test.local --import tsx ./scripts/test-all.ts --integration-only $(TEST_FLAGS)

test\:verify: app\:lint app\:build worker\:typecheck test\:quick ## Run a fast local verification pass

test\:verify-full: app\:lint app\:build worker\:typecheck test\:all ## Run the full local verification pass
