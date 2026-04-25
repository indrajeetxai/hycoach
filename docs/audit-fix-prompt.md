# Audit fix task

A planning-phase audit found 5 potential issues in the project files. Some may have already been fixed during the build so far. Your task: **verify each one against the current state of the files, then fix only the ones that still exist.**

For each issue below:
1. Read the relevant file(s) to check the current state
2. Tell me whether the issue still exists (yes/no, with the line you found)
3. If it still exists, apply the specified fix
4. If it's already been resolved (or the file has changed in a way that makes it moot), say so and skip

Do not make any change without verifying first. Do not change anything outside the scope of these 5 items. After all 5 are processed, give me a summary table: `[issue # | status | action taken]`.

---

## Issue 1 — CLAUDE.md uses wrong constant names (CRITICAL)

**File:** `CLAUDE.md`
**Section:** "Prompt loading (the modular architecture)"

**Check for:** an example import statement that uses `HONEST_PERSONA` (or any persona constant in the form `<NAME>_PERSONA`).

**The bug:** the sync script defined in `prompts/prompt-composition.md` converts file paths to constants by replacing `/` with `_` and uppercasing. So `prompts/personas/honest.md` becomes `PERSONAS_HONEST`, not `HONEST_PERSONA`. Any import using `HONEST_PERSONA` will fail at compile time.

**Verification:** also check `convex/_prompts.ts` if it exists — the actual generated constants confirm what name is correct. If that file exists and exports `PERSONAS_HONEST`, the bug is real and needs fixing in CLAUDE.md.

**Fix if still present:** in CLAUDE.md, change the example import from:
```ts
import { HYROX_KNOWLEDGE, HONEST_PERSONA, ... } from "./_prompts"
```
to:
```ts
import { HYROX_KNOWLEDGE, COACH_VOICE, PERSONAS_HONEST, ... } from "./_prompts"
```

Also: scan all other `.md` files in the project for any reference to `HONEST_PERSONA`, `ENCOURAGER_PERSONA`, or `OPERATOR_PERSONA` and correct them to `PERSONAS_HONEST` / `PERSONAS_ENCOURAGER` / `PERSONAS_OPERATOR`.

---

## Issue 2 — CHECKLIST has a version label error (CRITICAL)

**File:** `docs/CHECKLIST.md`
**Section:** end of the v1.1 phase (around the line that talks about S1-X8 completion)

**Check for:** a line that says something like "v1.0 (the full v1) is done when all of S1-X8 are checked."

**The bug:** S1-X8 is the v1.1 phase, not v1.0. v1.0 ended at item R4 (Phase R). Calling v1.1 "v1.0" creates confusion when Claude Code reads the line.

**Fix if still present:** change the line to:
```
**v1.1 is done when all of S1-X8 are checked. With v1.1 complete, you have the full v1 product. Time to plan v2.**
```

---

## Issue 3 — PRD §7 missing `plans.pausedAt` field (MINOR)

**File:** `docs/PRD.md`, §7 (Data model — Convex schema)

**Check for:** the `plans` table definition. Look for whether `pausedAt?: number` is in the field list.

**The bug:** CHECKLIST item O5 says "Add `plans.pausedAt?: number` field to schema if not already present from PRD §7." The "if not already present" hedge masks an incomplete PRD. The field should be in the PRD for completeness.

**Fix if still present:** in the `plans` table definition in PRD §7, add `pausedAt?: number,  // set when user pauses plan via missed-week flow; cleared on resume` after the `lastRegenAt` field. Also add a brief mention in PRD §0 changelog: "Added `plans.pausedAt` to schema for missed-week pause flow."

If `pausedAt` is already in the PRD schema, skip this fix.

---

## Issue 4 — README has misleading comment about sync-prompts.ts (MINOR)

**File:** `README.md`
**Section:** "Repo structure" tree

**Check for:** the line describing `scripts/sync-prompts.ts`. Look for the word "Generated" in its comment.

**The bug:** the comment says `# Generated; reads prompts/ → writes convex/_prompts.ts` but the script itself is authored — it generates `convex/_prompts.ts`. The word "Generated" implies the script itself is generated, which is wrong.

**Fix if still present:** change the comment to:
```
│   └── sync-prompts.ts # Reads prompts/ → writes convex/_prompts.ts (authored, runs via npm run sync-prompts)
```

---

## Issue 5 — README repo structure shows `scripts/` as if it pre-exists (MINOR)

**File:** `README.md`
**Section:** "Repo structure" tree

**Check for:** the `scripts/` directory in the structure diagram. Verify whether it was shown without context that it's created during the build.

**The bug:** the initial zip didn't ship a `scripts/` folder; it's created during checklist item D1 (sync-prompts implementation). The diagram showed it as if pre-existing.

**Verification first:** if the `scripts/` directory now actually exists in the working repo (because A1+ has been done and possibly D1 reached), this is no longer misleading and the fix is unnecessary.

**Fix only if scripts/ doesn't exist yet:** in the structure diagram, change the `scripts/` line to indicate it's created during D1:
```
├── scripts/            # Created during checklist D1
│   └── sync-prompts.ts # Reads prompts/ → writes convex/_prompts.ts
```

If `scripts/sync-prompts.ts` already exists in the working repo, skip this fix entirely — the structure diagram is now accurate.

---

## Final report

After processing all 5 items, give me a summary in this format:

| # | Issue | Status | Action |
|---|---|---|---|
| 1 | CLAUDE.md HONEST_PERSONA | [still present / already fixed / N/A] | [fix applied / no-op] |
| 2 | CHECKLIST v1.0 vs v1.1 label | [...] | [...] |
| 3 | PRD pausedAt missing | [...] | [...] |
| 4 | README "Generated" comment | [...] | [...] |
| 5 | README scripts/ structure | [...] | [...] |

Then stop. Do not start any other work. Wait for me to confirm before continuing the build.
