"use node";

import Anthropic from "@anthropic-ai/sdk";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "../_generated/api";
import { action } from "../_generated/server";
import { computeCommitmentMath, weeksUntilRace } from "../lib/commitmentMath";
import { composeSystemPrompt, type Persona } from "../lib/composePrompt";
import {
  realityCheckOutputSchema,
  type RealityCheckOutput,
} from "../lib/schemas";
import { REALITY_CHECK } from "../_prompts";

// Single source of truth for model + token budget — overrides PRD §9.2
// (`claude-sonnet-4-5` doesn't exist; latest Sonnet is 4.6).
const MODEL_REALITY_CHECK = "claude-sonnet-4-6";
const MAX_TOKENS_REALITY_CHECK = 1500;

const TOOL_DEFINITION = {
  name: "submit_reality_check",
  description:
    "Submit the Reality Check verdict for the user's commitment math.",
  input_schema: {
    type: "object" as const,
    properties: {
      feasible: { type: "boolean" },
      verdict: { type: "string", minLength: 100, maxLength: 800 },
      suggestions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: [
                "increase_days",
                "increase_minutes",
                "adjust_goal",
                "extend_timeline",
              ],
            },
            from: {},
            to: {},
            rationale: { type: "string" },
          },
          required: ["type", "from", "to", "rationale"],
        },
      },
    },
    required: ["feasible", "verdict", "suggestions"],
  },
};

function fmtTime(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

type BuildMsgInput = {
  raceDate: string;
  weeksOut: number;
  registrationStatus: "registered" | "considering";
  goalType: "finish" | "target";
  targetTimeSec?: number;
  goalTier: string;
  daysPerWeek: number;
  minPerSession: number;
  available: number;
  requiredMin: number;
  requiredMax: number;
  deficit: number;
  fitnessRating: string;
  detailedAssessment?: Record<string, unknown>;
  equipmentAccess?: {
    sled: boolean;
    wallBall: boolean;
    skiErg: boolean;
    rower: boolean;
  };
};

function buildUserMessage(o: BuildMsgInput): string {
  const goalLine =
    o.goalType === "finish"
      ? "just finish"
      : `target time ${o.targetTimeSec ? fmtTime(o.targetTimeSec) : "unspecified"}`;

  const equipmentLine = o.equipmentAccess
    ? (() => {
        const have = Object.entries(o.equipmentAccess)
          .filter(([, v]) => v)
          .map(([k]) => k);
        const lack = Object.entries(o.equipmentAccess)
          .filter(([, v]) => !v)
          .map(([k]) => k);
        return `  - equipment available: ${have.join(", ") || "none"}\n  - equipment missing: ${lack.join(", ") || "none"}`;
      })()
    : "  - equipment access: not specified";

  const assessmentLine =
    o.detailedAssessment && Object.keys(o.detailedAssessment).length > 0
      ? `  - detailed assessment: ${JSON.stringify(o.detailedAssessment)}`
      : "  - detailed assessment: skipped";

  return [
    `Race date: ${o.raceDate} (${o.weeksOut.toFixed(1)} weeks out)`,
    `Registration: ${o.registrationStatus}`,
    "",
    `Goal: ${goalLine}`,
    `Goal tier (computed): ${o.goalTier}`,
    "",
    "Commitment:",
    `  - days/week: ${o.daysPerWeek}`,
    `  - minutes/session: ${o.minPerSession}`,
    "",
    "Math (deterministic, computed app-side):",
    `  - available_minutes: ${o.available}`,
    `  - required_minutes_min: ${o.requiredMin}`,
    `  - required_minutes_max: ${o.requiredMax}`,
    `  - deficit (vs threshold = required_min × 0.85): ${o.deficit}`,
    `  - feasible: ${o.deficit === 0}`,
    "",
    "User profile:",
    `  - fitness rating: ${o.fitnessRating}`,
    assessmentLine,
    equipmentLine,
  ].join("\n");
}

const RETRY_SUFFIX = `

NOTE: Your previous response did not match the required schema. You must use the submit_reality_check tool with exactly these fields: feasible (boolean), verdict (string between 100 and 800 characters), suggestions (array of objects each with type, from, to, rationale). Suggestion type must be one of: increase_days, increase_minutes, adjust_goal, extend_timeline.`;

export const runRealityCheck = action({
  args: {},
  handler: async (ctx): Promise<RealityCheckOutput> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated.");

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error(
        "Reality Check is not yet enabled. Set ANTHROPIC_API_KEY in Convex env.",
      );
    }

    const profile = await ctx.runQuery(api.profiles.getProfile, {});
    if (
      !profile ||
      !profile.weeklyCommitmentDays ||
      !profile.minutesPerSession ||
      !profile.fitnessRating
    ) {
      throw new Error("Profile incomplete. Finish onboarding first.");
    }

    const race = await ctx.runQuery(api.races.getCurrentRace, {});
    if (!race) throw new Error("No upcoming race found. Finish onboarding first.");

    const weeksOut = weeksUntilRace(race.raceDate);
    const math = computeCommitmentMath({
      weeksUntilRace: weeksOut,
      daysPerWeek: profile.weeklyCommitmentDays,
      minPerSession: profile.minutesPerSession,
      goalType: race.goalType,
      targetTimeSec: race.targetTimeSec,
    });

    const persona: Persona = profile.coachPersona ?? "honest";
    const systemPrompt = composeSystemPrompt({
      persona,
      callContent: REALITY_CHECK,
    });

    const userMessage = buildUserMessage({
      raceDate: race.raceDate,
      weeksOut,
      registrationStatus: race.registrationStatus ?? "registered",
      goalType: race.goalType,
      targetTimeSec: race.targetTimeSec,
      goalTier: math.goal_tier,
      daysPerWeek: profile.weeklyCommitmentDays,
      minPerSession: profile.minutesPerSession,
      available: math.available_minutes,
      requiredMin: math.required_minutes_min,
      requiredMax: math.required_minutes_max,
      deficit: math.deficit,
      fitnessRating: profile.fitnessRating,
      detailedAssessment: profile.detailedAssessment,
      equipmentAccess: profile.equipmentAccess,
    });

    const anthropic = new Anthropic({ apiKey });

    async function callOnce(userMsg: string) {
      const resp = await anthropic.messages.create({
        model: MODEL_REALITY_CHECK,
        max_tokens: MAX_TOKENS_REALITY_CHECK,
        system: systemPrompt,
        tools: [TOOL_DEFINITION],
        tool_choice: { type: "tool", name: "submit_reality_check" },
        messages: [{ role: "user", content: userMsg }],
      });
      const toolUse = resp.content.find((b) => b.type === "tool_use");
      if (!toolUse || toolUse.type !== "tool_use") {
        return {
          ok: false as const,
          error: "Model did not return a tool_use block.",
        };
      }
      const parsed = realityCheckOutputSchema.safeParse(toolUse.input);
      return parsed.success
        ? { ok: true as const, data: parsed.data }
        : { ok: false as const, error: parsed.error.message };
    }

    let result = await callOnce(userMessage);
    if (!result.ok) {
      // One retry with stricter instructions appended.
      result = await callOnce(userMessage + RETRY_SUFFIX);
      if (!result.ok) {
        // PRD §4.1 wording. Validation detail is in Convex action logs.
        throw new Error("Coach is having an off day. Try again in a moment.");
      }
    }

    return result.data;
  },
});
