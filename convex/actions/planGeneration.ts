"use node";

import Anthropic from "@anthropic-ai/sdk";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { action } from "../_generated/server";
import { computeCommitmentMath, weeksUntilRace } from "../lib/commitmentMath";
import { composeSystemPrompt, type Persona } from "../lib/composePrompt";
import { planOutputSchema } from "../lib/schemas";
import { PLAN_GENERATION } from "../_prompts";

const MODEL_PLAN_GENERATION = "claude-sonnet-4-6";
const MAX_TOKENS_PLAN_GENERATION = 16000;
const MAX_PLAN_WEEKS = 24; // PRD §4.1 cap for >52 wks out
// Empirically Sonnet 4.6 takes ~187s for a 16k-token plan (curl-measured at
// ~83 tok/s with 15.5k output tokens). 300s gives ~60% buffer for slower
// variants or longer prompts. Note: PRD §11 / checklist E2 originally said
// "60s" — that's not achievable for full plans; spec needs revising.
const ACTION_TIMEOUT_MS = 300_000;

const TOOL_DEFINITION = {
  name: "submit_plan",
  description: "Submit the structured training plan for the user.",
  input_schema: {
    type: "object" as const,
    properties: {
      weeks: {
        type: "array",
        minItems: 1,
        items: {
          type: "object",
          properties: {
            weekNumber: { type: "integer", minimum: 1 },
            phase: {
              type: "string",
              enum: ["base", "build", "peak", "taper", "race"],
            },
            reasoning: { type: "string" },
            coachNote: { type: "string" },
            workouts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  dayOfWeek: { type: "integer", minimum: 0, maximum: 6 },
                  type: {
                    type: "string",
                    enum: ["run", "strength", "hyrox", "hybrid", "rest"],
                  },
                  title: { type: "string" },
                  durationMin: { type: "number", minimum: 0 },
                  whyThisWorkout: { type: "string" },
                  exercises: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        hyroxStation: {
                          type: ["string", "null"],
                          enum: [
                            "ski_erg",
                            "sled_push",
                            "sled_pull",
                            "burpee_broad_jump",
                            "rowing",
                            "farmers_carry",
                            "sandbag_lunge",
                            "wall_ball",
                            "run",
                            null,
                          ],
                        },
                        isSubstitute: { type: "boolean" },
                        prescribed: {
                          type: "object",
                          properties: {
                            sets: { type: "integer" },
                            reps: { type: "integer" },
                            timeSec: { type: "number" },
                            distanceM: { type: "number" },
                            weightKg: { type: "number" },
                            paceSecPerKm: { type: "number" },
                            rpe: { type: "integer", minimum: 1, maximum: 10 },
                            notes: { type: "string" },
                          },
                        },
                      },
                      required: ["name", "isSubstitute", "prescribed"],
                    },
                  },
                },
                required: [
                  "dayOfWeek",
                  "type",
                  "title",
                  "durationMin",
                  "whyThisWorkout",
                  "exercises",
                ],
              },
            },
          },
          required: ["weekNumber", "phase", "reasoning", "coachNote", "workouts"],
        },
      },
    },
    required: ["weeks"],
  },
};

const RETRY_SUFFIX = `

NOTE: Your previous response did not match the required schema. Use the submit_plan tool exactly. Every week needs weekNumber, phase, reasoning, coachNote, workouts. Every workout needs dayOfWeek (0-6, 0=Mon), type, title, durationMin, whyThisWorkout, exercises. Every exercise needs name, isSubstitute, prescribed. Phase must be one of base/build/peak/taper/race. Workout type must be one of run/strength/hyrox/hybrid/rest.`;

function fmtTime(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

// Snap to next Monday (0:00). PRD uses dayOfWeek 0 = Monday for workouts.
function nextMondayIso(): string {
  const d = new Date();
  const jsDay = d.getDay(); // 0=Sun ... 6=Sat
  const daysToAdd = jsDay === 1 ? 0 : (8 - jsDay) % 7;
  d.setDate(d.getDate() + daysToAdd);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split("T")[0];
}

export const runPlanGeneration = action({
  args: {},
  handler: async (ctx): Promise<{ planId: Id<"plans"> }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated.");

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error(
        "Plan generation is not enabled. Set ANTHROPIC_API_KEY in Convex env.",
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
    if (!race) {
      throw new Error("No upcoming race found. Finish onboarding first.");
    }

    const weeksOut = weeksUntilRace(race.raceDate);
    const totalWeeks = Math.min(
      MAX_PLAN_WEEKS,
      Math.max(1, Math.ceil(weeksOut)),
    );
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
      callContent: PLAN_GENERATION,
    });

    const equipmentLine = profile.equipmentAccess
      ? (() => {
          const have = Object.entries(profile.equipmentAccess)
            .filter(([, v]) => v)
            .map(([k]) => k);
          const lack = Object.entries(profile.equipmentAccess)
            .filter(([, v]) => !v)
            .map(([k]) => k);
          return `  - equipment available: ${have.join(", ") || "none"}\n  - equipment missing (substitute): ${lack.join(", ") || "none"}`;
        })()
      : "  - equipment access: not specified";

    const goalLine =
      race.goalType === "finish"
        ? "just finish"
        : `target time ${race.targetTimeSec ? fmtTime(race.targetTimeSec) : "unspecified"}`;

    const userMessage = [
      `Plan request — generate exactly ${totalWeeks} weeks.`,
      "",
      `Race date: ${race.raceDate} (${weeksOut.toFixed(1)} weeks out)`,
      `Registration: ${race.registrationStatus ?? "registered"}`,
      "",
      `Goal: ${goalLine}`,
      `Goal tier (computed): ${math.goal_tier}`,
      "",
      "Commitment:",
      `  - days/week: ${profile.weeklyCommitmentDays}`,
      `  - minutes/session: ${profile.minutesPerSession}`,
      "",
      "Math (deterministic):",
      `  - available_minutes: ${math.available_minutes}`,
      `  - required_minutes_min: ${math.required_minutes_min}`,
      `  - required_minutes_max: ${math.required_minutes_max}`,
      `  - feasible: ${math.deficit === 0}`,
      `  - deficit: ${math.deficit}`,
      "",
      "User profile:",
      `  - fitness rating: ${profile.fitnessRating}`,
      profile.detailedAssessment &&
      Object.keys(profile.detailedAssessment).length > 0
        ? `  - detailed assessment: ${JSON.stringify(profile.detailedAssessment)}`
        : "  - detailed assessment: skipped",
      equipmentLine,
      "",
      `Plan starts on the upcoming Monday. dayOfWeek 0 = Monday.`,
    ].join("\n");

    // maxRetries: 0 — SDK auto-retries on timeout were cascading 180s × 3 ≈ 540s,
    // exceeding Convex's 10-min platform cap. We fail fast instead and rely on
    // the application-level retry below for malformed responses.
    const anthropic = new Anthropic({
      apiKey,
      timeout: ACTION_TIMEOUT_MS,
      maxRetries: 0,
    });

    async function callOnce(userMsg: string) {
      const resp = await anthropic.messages.create({
        model: MODEL_PLAN_GENERATION,
        max_tokens: MAX_TOKENS_PLAN_GENERATION,
        system: systemPrompt,
        tools: [TOOL_DEFINITION],
        tool_choice: { type: "tool", name: "submit_plan" },
        messages: [{ role: "user", content: userMsg }],
      });
      const toolUse = resp.content.find((b) => b.type === "tool_use");
      if (!toolUse || toolUse.type !== "tool_use") {
        console.warn(
          "[planGeneration] Model did not return tool_use block",
          JSON.stringify({
            stop_reason: resp.stop_reason,
            content_block_types: resp.content.map((b) => b.type),
          }),
        );
        return {
          ok: false as const,
          error: "Model did not return a tool_use block.",
        };
      }
      const parsed = planOutputSchema.safeParse(toolUse.input);
      if (parsed.success) {
        return { ok: true as const, data: parsed.data };
      }
      // Log the SHAPE of the validation failure for debugging.
      // We log structural metadata only — never values, plan content, or
      // user race/profile data. Schema field names (e.g. "weekNumber",
      // "phase") and Zod issue messages describe the model's mistakes,
      // not user inputs, so they are safe to log.
      const input = toolUse.input;
      const inputObj =
        input && typeof input === "object" && !Array.isArray(input)
          ? (input as Record<string, unknown>)
          : null;
      const inputKeys = inputObj ? Object.keys(inputObj) : null;
      const weeksRaw = inputObj?.weeks;
      const weeksIsArray = Array.isArray(weeksRaw);
      const weeksTypeof = typeof weeksRaw;
      const weeksLength = weeksIsArray
        ? (weeksRaw as unknown[]).length
        : null;
      const firstWeekRaw = weeksIsArray
        ? (weeksRaw as unknown[])[0]
        : undefined;
      const firstWeekKeys =
        firstWeekRaw &&
        typeof firstWeekRaw === "object" &&
        !Array.isArray(firstWeekRaw)
          ? Object.keys(firstWeekRaw as Record<string, unknown>)
          : null;
      const issueSummary = parsed.error.issues.slice(0, 20).map((i) => ({
        path: i.path.join("."),
        code: i.code,
        message: i.message,
      }));
      console.warn(
        "[planGeneration] Zod parse failed",
        JSON.stringify({
          stop_reason: resp.stop_reason,
          usage: resp.usage,
          inputKeys,
          weeksTypeof,
          weeksIsArray,
          weeksLength,
          firstWeekKeys,
          totalIssues: parsed.error.issues.length,
          issues: issueSummary,
        }),
      );
      return { ok: false as const, error: parsed.error.message };
    }

    let result = await callOnce(userMessage);
    if (!result.ok) {
      result = await callOnce(userMessage + RETRY_SUFFIX);
      if (!result.ok) {
        // PRD §4.1 wording. Implementation detail (Zod parse failure) is
        // intentionally not leaked to the user; it's in Convex action logs.
        throw new Error("Coach is having an off day. Try again in a moment.");
      }
    }

    const startDate = nextMondayIso();
    const persistResult = await ctx.runMutation(api.plans.persistPlan, {
      raceId: race._id,
      startDate,
      modelUsed: MODEL_PLAN_GENERATION,
      plan: result.data,
    });

    return { planId: persistResult.planId };
  },
});
