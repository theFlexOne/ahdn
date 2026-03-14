# AGENTS.md

## Purpose

Project-level operating rules for Codex in this repository.

## Project Context

- Stack: TypeScript, Vite, React, Supabase.
- Package manager: npm (`package-lock.json` is present).
- Main code lives in `src/`.

## Working Style

- Prefer minimal, targeted diffs over broad refactors.
- Preserve existing architecture and naming conventions unless asked to redesign.
- Avoid introducing new dependencies unless there is a clear need.
- Keep changes production-oriented; remove throwaway debug code before finishing.

## Code Quality

- Match existing TypeScript style and strictness.
- Prefer explicit types when inference is unclear.
- Handle async and error paths explicitly.
- Keep functions small and composable when practical.
- Add comments only when intent is non-obvious.

## Validation

## Safety Rules

- Do not edit `.env*` files unless explicitly requested.
- Do not modify database schema (`schema.sql`, `supabase/`) unless explicitly requested.
- Do not run destructive commands (`rm -rf`, reset/clean operations) unless explicitly requested.
- Do not revert user-authored uncommitted changes outside the task scope.

## Change Communication

- Summarize what changed and why.
- Include file paths touched.
- Call out assumptions and any skipped validation.

## When Requirements Are Ambiguous

- Choose the smallest safe implementation that satisfies the request.
- If ambiguity could cause data loss, security issues, or schema changes, ask before proceeding.

## Miscellaneous

- Print all git commit messages inside a markdown box.
