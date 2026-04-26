// Assembles the Claude system prompt for every call from inlined string constants.
// Spec: prompts/prompt-composition.md.

import {
  HYROX_KNOWLEDGE,
  COACH_VOICE,
  PERSONAS_HONEST,
  PERSONAS_ENCOURAGER,
  PERSONAS_OPERATOR,
} from "../_prompts";

const PERSONA_MAP = {
  honest: PERSONAS_HONEST,
  encourager: PERSONAS_ENCOURAGER,
  operator: PERSONAS_OPERATOR,
} as const;

export type Persona = keyof typeof PERSONA_MAP;

export function composeSystemPrompt(opts: {
  persona: Persona;
  callContent: string;
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
  ].join("\n");
}
