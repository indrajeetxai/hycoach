# Prompts overview

The live prompts are in `prompts/` at the repo root. This file is a brief overview, not a duplicate.

## Files

| File | Purpose |
|---|---|
| `prompts/hyrox-knowledge.md` | Domain knowledge primer composed into every Claude call |
| `prompts/coach-voice.md` | Universal voice rules across all personas |
| `prompts/personas/honest.md` | The Honest Coach persona (default) |
| `prompts/personas/encourager.md` | The Encourager persona |
| `prompts/personas/operator.md` | The Operator persona |
| `prompts/reality-check.md` | Reality Check call instructions + examples |
| `prompts/plan-generation.md` | Plan Generation call instructions + worked example |
| `prompts/weekly-recap.md` | Weekly Recap call instructions + examples |
| `prompts/race-reflection.md` | Race Reflection call instructions + examples |
| `prompts/prompt-composition.md` | How prompts are loaded, composed, and used at runtime (reference, not a prompt) |

## Composition

Every Claude call's system prompt is built as:

```
<hyrox_knowledge>
  [hyrox-knowledge.md]
</hyrox_knowledge>

<coach_voice>
  [coach-voice.md]
  [persona file based on user's choice]
</coach_voice>

<call>
  [the specific call file: reality-check.md, plan-generation.md, etc.]
</call>
```

See `prompts/prompt-composition.md` for the runtime loading mechanism (build-time inlining via sync script).

## Editing prompts

Prompts are edited in place. After editing, run `npm run sync-prompts` to regenerate `convex/_prompts.ts`. The sync also runs automatically before `npm run dev` and `npm run build`.

## Versioning

Prompts are versioned via git, like code. Major changes to a prompt that you want to roll back from should go through a normal commit.
