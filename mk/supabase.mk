.PHONY: sb\:types sb\:schema-remote sb\:schema-local sb\:data-remote sb\:data-local

sb\:types: ## Generate Supabase TypeScript types
	supabase gen types typescript --project-id $(SUPABASE_PROJECT_ID) --schema public > src/lib/database.types.ts

sb\:schema-remote: ## Dump the remote public schema
	supabase db dump --schema public -f supabase/schema.sql

sb\:schema-local: ## Dump the local public schema
	supabase db dump --schema public --local -f supabase/schema.sql

sb\:data-remote: ## Dump the remote public data
	supabase db dump --linked --schema public --data-only -f supabase/data.sql

sb\:data-local: ## Dump the local public data
	supabase db dump --linked --schema public --local --data-only -f supabase/data.sql
