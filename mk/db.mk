.PHONY: db\:reset

db\:reset: ## Reset the local database from checked-in schema and data
	bash ./scripts/db_reset.sh supabase
