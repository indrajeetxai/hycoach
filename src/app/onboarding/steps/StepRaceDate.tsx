"use client";

import { Input } from "@/components/ui/input";
import type { RaceDatePath, StepProps } from "../types";

type Validation =
  | { valid: false; error: string }
  | { valid: true; path: RaceDatePath; warning?: string };

const WEEK_PRESETS = [12, 16, 20, 24, 52] as const;

function targetDateFromWeeks(weeks: number): string {
  const d = new Date();
  d.setDate(d.getDate() + weeks * 7);
  // Snap forward to the next Saturday — Hyrox events run weekends
  const daysUntilSat = (6 - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + daysUntilSat);
  return d.toISOString().split("T")[0];
}

function validate(dateStr: string): Validation {
  const raceMs = new Date(dateStr).getTime();
  const nowMs = Date.now();
  if (raceMs <= nowMs) {
    return { valid: false, error: "Race date must be in the future." };
  }
  const weeksOut = (raceMs - nowMs) / (7 * 24 * 60 * 60 * 1000);
  if (weeksOut < 4) {
    return {
      valid: true,
      path: "short",
      warning:
        "Less than 4 weeks out — we'll use the detailed assessment to build the most accurate plan we can in this time.",
    };
  }
  if (weeksOut > 52) {
    return {
      valid: true,
      path: "long",
      warning:
        "More than a year out — your plan will start 24 weeks before race day. You'll get a preparation primer until then.",
    };
  }
  return { valid: true, path: "standard" };
}

const todayIso = new Date().toISOString().split("T")[0];

export function StepRaceDate({ formData, updateFormData }: StepProps) {
  const status = formData.registrationStatus ?? "registered";
  const dateStr = formData.raceDate ?? "";
  const selectedWeeks = formData.selectedWeeks;
  const result: Validation | null = dateStr ? validate(dateStr) : null;

  function selectMode(next: "registered" | "considering") {
    if (next === status) return;
    updateFormData({
      registrationStatus: next,
      raceDate: undefined,
      raceDatePath: undefined,
      selectedWeeks: undefined,
    });
  }

  function handleDateChange(value: string) {
    const r = value ? validate(value) : null;
    updateFormData({
      raceDate: value || undefined,
      raceDatePath: r?.valid ? r.path : undefined,
      registrationStatus: "registered",
      selectedWeeks: undefined,
    });
  }

  function handleChipClick(w: (typeof WEEK_PRESETS)[number]) {
    const date = targetDateFromWeeks(w);
    const r = validate(date);
    updateFormData({
      raceDate: date,
      raceDatePath: r.valid ? r.path : undefined,
      registrationStatus: "considering",
      selectedWeeks: w,
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-[18px] font-medium">When&apos;s your race?</h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          We&apos;ll build your plan backward from race day.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => selectMode("registered")}
          className={[
            "min-h-[44px] rounded-lg border px-3 py-2.5 text-[13px] font-medium transition",
            status === "registered"
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-transparent hover:bg-accent",
          ].join(" ")}
        >
          I have a race date
        </button>
        <button
          type="button"
          onClick={() => selectMode("considering")}
          className={[
            "min-h-[44px] rounded-lg border px-3 py-2.5 text-[13px] font-medium transition",
            status === "considering"
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-transparent hover:bg-accent",
          ].join(" ")}
        >
          I&apos;m not registered yet
        </button>
      </div>

      {status === "registered" && (
        <Input
          type="date"
          value={dateStr}
          min={todayIso}
          onChange={(e) => handleDateChange(e.target.value)}
          className="h-11 text-sm"
        />
      )}

      {status === "considering" && (
        <div className="flex flex-col gap-3">
          <p className="text-[12px] text-muted-foreground">
            Pick a target window:
          </p>
          <div className="flex flex-wrap gap-2">
            {WEEK_PRESETS.map((w) => {
              const isSelected = selectedWeeks === w;
              return (
                <button
                  key={w}
                  type="button"
                  onClick={() => handleChipClick(w)}
                  className={[
                    "min-h-[44px] rounded-full border px-4 py-2 text-[13px] font-medium transition",
                    isSelected
                      ? "border-green-600 bg-green-600 text-white"
                      : "border-border bg-transparent hover:bg-accent",
                  ].join(" ")}
                >
                  {w} wk
                </button>
              );
            })}
          </div>
          <p className="text-[12px] text-muted-foreground">
            We&apos;ll build the plan toward this date. You can lock in a real race anytime in Settings.
          </p>
        </div>
      )}

      {result && !result.valid && (
        <p className="text-[13px] text-destructive">{result.error}</p>
      )}

      {result?.valid && result.warning && (
        <div
          className={[
            "rounded-md px-3 py-2.5 text-[13px] leading-snug",
            result.path === "short"
              ? "border-l-2 border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400"
              : "border-l-2 border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400",
          ].join(" ")}
        >
          {result.warning}
        </div>
      )}
    </div>
  );
}
