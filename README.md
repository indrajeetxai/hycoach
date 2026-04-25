# HyCoach

Your personal Hyrox coach. A web app that generates honest, personalized, adaptive Hyrox training plans.

## Status

Currently building **v0.5** — the first shippable release. See `docs/CHECKLIST.md` for the atomic build checklist and `docs/PRD.md` §11 for the full release path (v0.5 → v0.7 → v1.0 → v1.1).

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui
- Convex (backend, auth, AI calls)
- Anthropic Claude API (Sonnet 4.5 + Haiku 4.5)
- Vercel + Convex Cloud (deploy)

## Getting started

```bash
# Install dependencies
npm install

# Set up Convex (creates dev deployment, prompts for login)
npx convex dev

# Set environment variables
cp .env.example .env.local
# Then fill in:
#   NEXT_PUBLIC_CONVEX_URL (from convex dev output)
#   AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET (from Google Cloud Console)
# In Convex dashboard, set:
#   npx convex env set ANTHROPIC_API_KEY <your-key>

# Sync prompts into Convex (auto-runs on dev/build, but run manually first time)
npm run sync-prompts

# Run dev server
npm run dev
```

## Repo structure

```
hybrid/
├── CLAUDE.md         # Claude Code project memory — read first
├── BOOTSTRAP.md      # First message to send to Claude Code
├── docs/
│   ├── PRD.md        # Product requirements (locked at v3.0)
│   ├── PROMPTS.md    # Pointer to prompts/ (overview, not duplicate content)
│   └── CHECKLIST.md  # Atomic build checklist per release
├── prompts/          # LIVE prompt files — edit freely, no code change needed
│   ├── hyrox-knowledge.md
│   ├── coach-voice.md
│   ├── personas/
│   ├── reality-check.md
│   ├── plan-generation.md
│   ├── weekly-recap.md
│   ├── race-reflection.md
│   └── prompt-composition.md   # How prompts compose at runtime (reference)
├── .claude/
│   ├── settings.json   # Claude Code permissions
│   └── commands/       # Custom slash commands
├── scripts/            # Created during checklist D1
│   └── sync-prompts.ts # Reads prompts/ → writes convex/_prompts.ts (authored, runs via npm run sync-prompts)
├── src/                # Next.js app (created by scaffold)
├── convex/             # Convex backend (created by scaffold)
└── package.json
```

## Working with this repo

This project is built primarily with Claude Code in VS Code. The `CLAUDE.md` file at the repo root is Claude's operating manual. Slash commands are in `.claude/commands/`.

**Key principle: prompts and code are decoupled.** Prompts live in `prompts/`. A small build-time sync script generates `convex/_prompts.ts` from those `.md` files; Convex actions import string constants from the generated module. To change Coach voice, Hyrox knowledge, or call instructions, edit the relevant `prompts/*.md` and run `npm run sync-prompts` (auto-runs on dev/build).

## Documentation

- `docs/PRD.md` — Product Requirements Document (v3.0, locked)
- `docs/CHECKLIST.md` — atomic build checklist; the `/build-next` slash command works from this
- `docs/PROMPTS.md` — overview of the prompt system

## Slash commands

In a Claude Code session in this repo:

- `/build-next` — pick up the next unchecked item from `docs/CHECKLIST.md`
- `/review-prd` — read the PRD before answering a scope question
- `/test-prompt <name>` — print a Claude API call's assembled prompt for testing in the Anthropic Workbench
- `/ship-it` — pre-deploy checklist

## One release at a time

v0.5 → v0.7 → v1.0 → v1.1. Don't pull v1.0 features forward into v0.5. Note them as `// TODO(v0.7):` comments and move on.
