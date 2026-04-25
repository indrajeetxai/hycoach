# Bootstrap prompt

This is the first message to send to Claude Code in this project. Copy-paste it as your first message after opening the project in VS Code with Claude Code.

Don't paraphrase it. The structure matters.

---

## Copy from below this line

You are Claude Code working on the HyCoach project. Before you write any code, do the following:

1. Read `CLAUDE.md` end to end.
2. Read `docs/PRD.md` §1, §2, §10, §11 (in that order).
3. Read `docs/CHECKLIST.md` to see the v0.5 atomic checklist.
4. Read `prompts/prompt-composition.md` to understand how prompts compose at runtime.

Then confirm to me:
- The current release we're building (should be v0.5)
- The stack (should be Next.js 15 + Convex + shadcn/ui + Anthropic SDK)
- The architectural rule about where Claude API calls happen (should be: Convex actions only, server-side)
- The architectural rule about prompts (should be: authored in `prompts/`, inlined into Convex at build time via a sync script — not read at runtime)
- The first checklist item we'll work on (should be A1)
- One thing from the PRD or checklist you have a question about, OR "no questions" if everything is clear

Once I confirm you have it right, I'll ask you to start with item A1. We'll move through `docs/CHECKLIST.md` one item at a time using the `/build-next` slash command.

Do NOT start coding until I confirm. Just read and confirm.

## End of copy

---

## What this bootstrap does

- Forces context loading before action — Claude Code reads the right files first, not whatever it sees first
- Forces an explicit confirmation moment — you see whether it understood, before any code gets written
- Sets expectations for the workflow — one item at a time, via `/build-next`, working from `docs/CHECKLIST.md`
- Surfaces ambiguity early — by asking "one thing you have a question about," you find PRD gaps before they become bugs
- Verifies the two most important architectural commitments (Claude calls are server-side; prompts are inlined at build time) up front
