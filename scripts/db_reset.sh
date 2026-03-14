#!/usr/bin/env bash
set -euo pipefail

export PGPASSWORD=postgres
export PGOPTIONS='--client-min-messages=warning'

DIR="$1"

require_file() {
  local file_path="$1"

  if [[ ! -f "$file_path" ]]; then
    echo "Required file not found: $file_path" >&2
    exit 1
  fi
}

run_psql() {
  psql -h localhost -p 54322 -U postgres -d postgres -v ON_ERROR_STOP=1 -q \
    "$@" >/dev/null
}

require_file "$DIR/schema.sql"
run_psql -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
run_psql -f "$DIR/schema.sql"

if [[ -f "$DIR/data.sql" ]]; then
  run_psql -f "$DIR/data.sql"
fi
