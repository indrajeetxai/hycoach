# Prompt composition reference

Human + Claude Code reference, not sent to Claude itself. Documents how prompts are loaded, composed, and used at runtime in the Convex actions.

---

## Loading: build-time inlining (not runtime fs reads)

Convex functions run in an isolated runtime that **cannot read arbitrary files at runtime**. Prompts must be inlined into the bundle at build time.

**Implementation (Pattern A — recommended):**

A small sync script reads `prompts/*.md` and generates a TypeScript module. Convex actions import string constants from that module.

`scripts/sync-prompts.ts` (build it during checklist item D1):
```ts
import { readdirSync, readFileSync, writeFileSync } from "fs"
import { join } from "path"

const PROMPTS_DIR = "prompts"
const OUTPUT_FILE = "convex/_prompts.ts"

function toConst(name: string): string {
  return name
    .replace(/[\/\-]/g, "_")
    .replace(/\.md$/, "")
    .toUpperCase()
}

function walk(dir: string, prefix = ""): { name: string; content: string }[] {
  const entries = readdirSync(dir, { withFileTypes: true })
  const result: { name: string; content: string }[] = []
  for (const entry of entries) {
    const full = join(dir, entry.name)
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name
    if (entry.isDirectory()) {
      result.push(...walk(full, rel))
    } else if (entry.name.endsWith(".md") && entry.name !== "prompt-composition.md") {
      result.push({ name: rel, content: readFileSync(full, "utf-8") })
    }
  }
  return result
}

const prompts = walk(PROMPTS_DIR)
const lines = [
  "// AUTO-GENERATED. Do not edit. Run `npm run sync-prompts`.",
  "// Source: prompts/*.md",
  "",
]
for (const p of prompts) {
  const constName = toConst(p.name)
  const escaped = p.content.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${")
  lines.push(`export const ${constName} = \`${escaped}\``)
  lines.push("")
}
writeFileSync(OUTPUT_FILE, lines.join("\n"))
console.log(`Synced ${prompts.length} prompts to ${OUTPUT_FILE}`)
```

`package.json` additions:
```json
{
  "scripts": {
    "sync-prompts": "tsx scripts/sync-prompts.ts",
    "predev": "npm run sync-prompts",
    "prebuild": "npm run sync-prompts"
  }
}
```

`.gitignore` additions:
```
convex/_prompts.ts
```

After running `npm run sync-prompts`, `convex/_prompts.ts` exports constants like:
- `HYROX_KNOWLEDGE`
- `COACH_VOICE`
- `PERSONAS_HONEST`
- `PERSONAS_ENCOURAGER`
- `PERSONAS_OPERATOR`
- `REALITY_CHECK`
- `PLAN_GENERATION`
- `WEEKLY_RECAP`
- `RACE_REFLECTION`

(`prompt-composition.md` is excluded — this is reference, not a prompt.)

---

## Composition: how the system prompt assembles

A Convex action composes the system prompt from those imported constants:

```ts
// convex/lib/composePrompt.ts
import {
  HYROX_KNOWLEDGE,
  COACH_VOICE,
  PERSONAS_HONEST,
  PERSONAS_ENCOURAGER,
  PERSONAS_OPERATOR,
} from "../_prompts"

const PERSONA_MAP = {
  honest: PERSONAS_HONEST,
  encourager: PERSONAS_ENCOURAGER,
  operator: PERSONAS_OPERATOR,
} as const

export function composeSystemPrompt(opts: {
  persona: keyof typeof PERSONA_MAP
  callContent: string
}): string {
  return [
    "<hyrox_knowledge>",
    HYROX_KNOWLEDGE,
    "</hyrox_knowledge>",
    "",
    "<coach_voice>",
    COACH_VOICE,
    "",
    PERSONA_MAP[opts.persona],
    "</coach_voice>",
    "",
    "<call>",
    opts.callContent,
    "</call>",
  ].join("\n")
}
```

A Convex action (e.g., `realityCheck.ts`) calls `composeSystemPrompt({ persona, callContent: REALITY_CHECK })` and passes the result as `system` to the Anthropic SDK call.

---

## Per-call user message

The user message provides the runtime data:

- **Reality Check:** math result + user profile excerpt
- **Plan Generation:** full profile + accepted goal + race date + plan length
- **Weekly Recap:** last week's logs + adjustments + this week's prescribed
- **Race Reflection:** race result + plan summary + user reflection text

Each Convex action constructs this user message from Convex DB queries.

---

## Tool definitions for structured outputs

Reality Check and Plan Generation use Anthropic tool-use to force structured output.

### `submit_reality_check` tool input schema

```json
{
  "type": "object",
  "properties": {
    "feasible": { "type": "boolean" },
    "verdict": { "type": "string", "minLength": 100, "maxLength": 800 },
    "suggestions": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "type": {
            "enum": ["increase_days", "increase_minutes", "adjust_goal", "extend_timeline"]
          },
          "from": {},
          "to": {},
          "rationale": { "type": "string" }
        },
        "required": ["type", "from", "to", "rationale"]
      }
    }
  },
  "required": ["feasible", "verdict", "suggestions"]
}
```

### `submit_plan` tool input schema

Mirror PRD §7 (the `plans`/`weeks`/`workouts`/`exercises` tables, nested as JSON). Build mechanically when wiring Plan Generation in checklist item E1. Define the Zod schema first in `convex/lib/schemas.ts`, then derive the JSON Schema from it.

---

## Tool choice

For tool-using calls: `tool_choice = { type: "tool", name: "submit_reality_check" }` (or `submit_plan`).
For Weekly Recap and Race Reflection: no tool, plain text response, max_tokens cap appropriate to length.

---

## Model selection per call

(Verify exact model strings in Anthropic docs at build time.)

| Call | Model | Notes |
|---|---|---|
| Reality Check | `claude-sonnet-4-5` | Tone + math sensitive |
| Plan Generation | `claude-sonnet-4-5` | Hardest reasoning task |
| Plan Regeneration | `claude-sonnet-4-5` | Same as Plan Generation |
| Weekly Recap | `claude-haiku-4-5` | Short output, scales with users |
| Race Reflection | `claude-haiku-4-5` | Short, voice-driven |

---

## Max tokens per call

- Reality Check: 1500
- Plan Generation: 16000 (full plan can be large for 24-week plans)
- Weekly Recap: 400
- Race Reflection: 500

---

## Architecture rule (recap)

**All Claude calls happen in Convex actions.** The Anthropic SDK is called server-side; the API key (`ANTHROPIC_API_KEY`) lives in Convex env vars and is never exposed to the client. Frontend triggers Convex actions via the React useAction hook; actions compose prompts (from inlined constants), call Anthropic, validate with Zod, persist results to Convex DB, and return minimum data needed for the UI.
