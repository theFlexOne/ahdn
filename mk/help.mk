.PHONY: help

help: ## List available targets
	@awk '/^[a-zA-Z0-9_.\\:-]+:.*## / { \
		line = $$0; \
		target = ""; \
		for (i = 1; i <= length(line); i++) { \
			char = substr(line, i, 1); \
			prev = (i > 1) ? substr(line, i - 1, 1) : ""; \
			if (char == ":" && prev != "\\") { \
				break; \
			} \
			target = target char; \
		} \
		description_index = index(line, "## "); \
		description = substr(line, description_index + 3); \
		gsub(/\\:/, ":", target); \
		printf "%-30s %s\n", target, description; \
	}' $(MAKEFILE_LIST) | sort

