# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## What we're building

**HyCoach** — a web app that acts as a personal Hyrox coach. Users enter their race date, fitness, goals, and time commitment. The app generates an honest, personalized, adaptive Hyrox training plan with a selectable Coach persona.

**Three product moments:**
1. **Reality Check** — push back honestly when goal/time math doesn't add up
2. **Plan reveal with reasoning** — every week explains *why* it looks like it does
3. **Adaptation** — plan recalibrates weekly from logged workouts

---

## Project state

**Pre-scaffold.** No `src/`, `convex/`, `package.json`, or `scripts/` exist yet. All v0.5 checklist items are unchecked. Start at A1.

For new sessions: send `BOOTSTRAP.md` content as the first message. It forces context loading and an explicit confirmation before any code gets written.

---

## Source of truth

- **PRD:** `docs/PRD.md` — locked. Read before answering questions about scope, flows, schema, or behavior.
- **Build checklist:** `docs/CHECKLIST.md` — atomic, ordered items per release. The `/build-next` command works from this file. Mark items `[x]` as completed.
- **Prompts (live):** `prompts/` — the only place prompts are edited. Never hardcode prompt content in TypeScript.
- **Build path:** PRD §11 — v0.5 → v0.7 → v1.0 → v1.1. Currently building **v0.5**.

---

## Commands

Once scaffolded (after A1–A3), these are the standard commands:

```bash
npm run dev          # starts Next.js dev server (auto-runs sync-prompts first)
npm run build        # production build (auto-runs sync-prompts first)
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm run sync-prompts # regenerates convex/_prompts.ts from prompts/*.md
npx convex dev       # starts Convex dev server + watches for schema changes
npx convex deploy    # pushes Convex to production
```

**Verify after changes:** `npm run typecheck && npm run lint`. For Convex changes, ensure `npx convex dev` runs clean.

Initial setup:
```bash
npm install
npx convex dev          # creates dev deployment, prompts for login
cp .env.example .env.local   # fill in NEXT_PUBLIC_CONVEX_URL, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET
npx convex env set ANTHROPIC_API_KEY <key>
npm run sync-prompts    # run manually the first time before dev
```

---

## Stack

- **Frontend:** Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui
- **Backend:** Convex (DB + actions + queries + mutations)
- **Auth:** Convex Auth + Google OAuth
- **AI:** Anthropic Claude API — called from Convex actions only, never from the browser

| Call | Model | Max tokens | SDK timeout | SDK maxRetries |
|---|---|---|---|---|
| Reality Check | `claude-sonnet-4-6` | 1500 | 60s (default) | default |
| Plan Generation / Regeneration | `claude-sonnet-4-6` | 16000 | **300s** | **0** (see Prompt system) |
| Weekly Recap | `claude-haiku-4-5-20251001` | 400 | default | default |
| Race Reflection | `claude-haiku-4-5-20251001` | 500 | default | default |

- **Charts:** Recharts (v1.0+)
- **Analytics:** PostHog (v1.1)
- **Deploy:** Vercel (frontend) + Convex Cloud (backend)

---

## Architecture rules (non-negotiable)

1. **All Claude API calls happen in Convex actions, server-side.** Never call Anthropic from a Next.js route handler or browser. The API key lives in Convex env vars.
2. **Prompts are authored in `prompts/` and inlined into Convex at build time** via `scripts/sync-prompts.ts` → `convex/_prompts.ts`. `convex/_prompts.ts` is gitignored and never hand-edited.
3. **Use Anthropic tool-use for structured outputs** (Reality Check, Plan Generation). Validate with Zod immediately after parsing. Zod schemas live in `convex/lib/schemas.ts`.
4. **Convex schema lives in `convex/schema.ts`.** Match it to PRD §7 exactly. Don't add fields not in the PRD.
5. **Derived state is computed at query time, not stored.** Workout "missed" status (`scheduledDate < today AND status === "scheduled" AND no log`) and `weeks.status` (from `startDate` vs today).
6. **No browser storage for app data.** Use Convex queries.
7. **Mobile-first.** Test at 375px viewport.

---

## Prompt system

`scripts/sync-prompts.ts` walks `prompts/`, reads each `.md`, writes `convex/_prompts.ts` exporting each as a string constant (e.g., `HYROX_KNOWLEDGE`, `COACH_VOICE`, `PERSONAS_HONEST`, `REALITY_CHECK`, `PLAN_GENERATION`, `WEEKLY_RECAP`, `RACE_REFLECTION`). `prompt-composition.md` is excluded — it's reference only.

`convex/lib/composePrompt.ts` assembles the system prompt at call time:
```
<hyrox_knowledge>…</hyrox_knowledge>
<coach_voice>…[persona]…</coach_voice>
<call>…[call-specific content]…</call>
```

For Reality Check and Plan Generation, force structured output via `tool_choice = { type: "tool", name: "submit_reality_check" }` / `submit_plan`. See `prompts/prompt-composition.md` for the full tool input schemas.

**Plan Generation must use tool-only output — no prose before `submit_plan`.** The first content block of the model's response must be the `submit_plan` tool_use; any text/preamble/markdown before it eats the 16k output budget and produces an empty tool input (we observed this in v3.1.2). The canonical wording lives in `prompts/plan-generation.md` under `<output_protocol>`. Pair this with SDK `maxRetries: 0` so timeouts fail fast rather than cascading past Convex's ~10-min platform cap. Application-level Zod retry stays at one attempt.

---

## File naming conventions

- Convex actions: `convex/actions/<domain>.ts` (e.g., `realityCheck.ts`, `planGeneration.ts`)
- Convex queries/mutations: `convex/<domain>.ts` (e.g., `convex/workouts.ts`)
- Convex pure helpers: `convex/lib/<domain>.ts` (e.g., `commitmentMath.ts`, `adaptationEngine.ts`)
- React components: PascalCase, one per file
- Imports: absolute via `@/` for `src/`

---

## Constraints

- **TypeScript:** strict mode. No `any` — narrow raw Claude API responses with Zod immediately.
- **Scope:** v0.5 only. Note v0.7+ ideas as `// TODO(v0.7):` and move on.
- **Tests:** not required for v0.5. Required for the adaptation engine in v1.0 (`convex/lib/__tests__/adaptationEngine.test.ts`).
- Never invent library APIs. If unsure how Convex, Convex Auth, shadcn/ui, or the Anthropic SDK work, check the docs first.
- Never ship a Claude API call without Zod validation on the output.

---

## Workflow

1. **Read.** If the task touches the PRD or prompts, read the relevant section first. Use `/review-prd` if helpful.
2. **Plan.** For >~30 lines of changes, share the plan and wait for confirmation.
3. **Build.** Stay within scope.
4. **Verify.** `npm run typecheck && npm run lint`. For Convex changes, `npx convex dev` runs clean.
5. **Mark.** `[ ]` → `[x]` in `docs/CHECKLIST.md`.
6. **Report.** What changed, what to test manually, what's next.

For build-path work: `/build-next` — picks the next unchecked item from `docs/CHECKLIST.md`.

---

## Slash commands

- `/build-next` — pick up the next unchecked item from `docs/CHECKLIST.md`
- `/review-prd` — read the PRD before answering a scope question
- `/test-prompt <call-name>` — assemble and print a Claude API call's prompt for Anthropic Workbench testing
- `/ship-it` — pre-deploy checklist (typecheck, lint, secrets scan, mobile, build)

---

## Modular architecture: what's independent of what

- Change Coach voice → edit `prompts/personas/honest.md` (or `encourager.md`, `operator.md`), run `npm run sync-prompts`
- Change plan generation logic → edit `prompts/plan-generation.md` (prompt) OR `convex/actions/planGeneration.ts` (mechanics) — they're independent
- Add a new persona → new file in `prompts/personas/`, new enum in `convex/schema.ts`, new card in persona picker
- Change Reality Check math → edit `convex/lib/commitmentMath.ts`; prompts unchanged
- Add a Hyrox knowledge fact → edit `prompts/hyrox-knowledge.md`; every call picks it up after next sync
