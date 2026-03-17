---
name: commit-message
description: Generate a git commit message from staged changes, or from unstaged changes if nothing is staged.
---

# Purpose

Generate a clean, copy-pasteable git commit message from the current repository diff.

# When to use

Use this skill when the user asks for any of the following:

- a commit message
- a git commit summary
- a message for staged changes
- a message based on the current diff
- help writing a commit message

# Instructions

1. Inspect staged changes first.
2. If no files are staged, inspect unstaged changes.
3. If there are no staged or unstaged changes, output exactly:

   `No staged or unstaged changes found.`

4. Format the output as:
   - one concise summary line
   - one blank line
   - bullet points with specific implementation details

5. Bullet guidance:
   - use 1 to 3 bullets for smaller changes
   - use 3 to 8 bullets for larger changes
   - use only as many bullets as necessary

6. Writing guidance:
   - prefer imperative mood for the summary when natural
   - keep the summary specific
   - keep bullets concrete and implementation-focused
   - avoid vague bullets such as:
     - updated code
     - made fixes
     - improved things
     - changed stuff

7. Do not include explanatory text before or after the commit message.

8. Output only the final commit message in a single markdown code block.

# Repo-specific considerations

When relevant, prefer wording that matches this repository:

- TypeScript, Vite, React, Supabase
- minimal targeted diffs
- existing architecture and naming conventions
- production-oriented changes
- explicit handling of async and error paths

# Optional user context

The user may provide extra context such as:

- intended feature name
- ticket or issue number
- preferred commit type
- desired emphasis for the summary
