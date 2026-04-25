---
description: Pick up the next unchecked item from docs/CHECKLIST.md
---

You are about to advance the build by one checklist item.

**Process:**

1. Read `docs/CHECKLIST.md`. Find the first unchecked item (`[ ]`) in the current release section (v0.5 unless told otherwise).
2. Re-read the relevant PRD section if the item is non-trivial. Use `/review-prd` if helpful.
3. Tell me:
   - The item ID and title (e.g., "D2 — Implement commitment math")
   - What files you'll create or change
   - Any decisions you'd want my input on before starting
4. Wait for my confirmation. If the change is small (under ~30 lines, no architectural choice), proceed without waiting.
5. Build the item.
6. Run `npm run typecheck` (or `npx tsc --noEmit`) and `npm run lint` if those scripts exist. Fix what you find.
7. Update `docs/CHECKLIST.md` — change `[ ]` to `[x]` for the completed item.
8. Report:
   - What changed
   - What I should test manually
   - The next item (don't start it; wait for me to call `/build-next` again)

**Constraints:**

- Stay strictly within the current release's scope. If you have a v0.7+ idea, leave it as a `// TODO(v0.7):` comment and move on.
- If something is ambiguous, re-read the relevant PRD section before guessing.
- If you can't proceed without a decision (e.g., a UI choice not in the PRD), ask me first.
- One item at a time. Don't roll multiple items into one change.
