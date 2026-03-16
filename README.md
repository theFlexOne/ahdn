# ahdn

## Environment Files

- `.env.local`: frontend-safe Vite variables only.
- `.env.admin.local`: privileged manual-use credentials; not auto-loaded by app workflows.
- `.env.test.local`: optional test-only overrides for `make test-all`, `make test-quick`, and `make test-integration`.
- `workers/image-converter/.env.local`: optional worker-only settings.
- `supabase/functions/.env`: local Supabase function secrets for the local stack only.

Tracked examples live in `.env.example`, `.env.admin.example`, `.env.test.example`, `workers/image-converter/.env.example`, and `supabase/functions/.env.example`.
