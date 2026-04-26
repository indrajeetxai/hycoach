"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";
import type { StepProps } from "../types";

const DAY_OPTIONS = [2, 3, 4, 5, 6, 7] as const;
const DAYS_DEFAULT = 4;

const MINUTE_OPTIONS = [30, 45, 60, 90, 120] as const;
const MINS_DEFAULT = 60;

export function StepTimeCommitment({ formData, updateFormData }: StepProps) {
  const days = formData.weeklyCommitmentDays ?? DAYS_DEFAULT;
  const mins = formData.minutesPerSession ?? MINS_DEFAULT;

  // Seed defaults on mount
  useEffect(() => {
    updateFormData({
      weeklyCommitmentDays: formData.weeklyCommitmentDays ?? DAYS_DEFAULT,
      minutesPerSession: formData.minutesPerSession ?? MINS_DEFAULT,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-7">
      <div>
        <h2 className="text-[18px] font-medium">How much time can you commit?</h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Be realistic. A plan you can follow beats a perfect plan you can&apos;t.
        </p>
      </div>

      {/* Days per week */}
      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium">Days per week</label>
        <div className="grid grid-cols-6 gap-2">
          {DAY_OPTIONS.map((d) => {
            const selected = days === d;
            return (
              <button
                key={d}
                type="button"
                onClick={() => updateFormData({ weeklyCommitmentDays: d })}
                className={cn(
                  "min-h-[44px] rounded-md border px-1 text-sm font-medium tabular-nums transition-colors",
                  selected
                    ? "border-green-400 bg-green-200 text-green-900"
                    : "border-border bg-background hover:bg-muted",
                )}
                aria-pressed={selected}
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>

      {/* Minutes per day */}
      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium">Minutes per day</label>
        <div className="grid grid-cols-5 gap-2">
          {MINUTE_OPTIONS.map((m) => {
            const selected = mins === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => updateFormData({ minutesPerSession: m })}
                className={cn(
                  "min-h-[44px] rounded-md border px-1 text-sm font-medium tabular-nums transition-colors",
                  selected
                    ? "border-green-400 bg-green-200 text-green-900"
                    : "border-border bg-background hover:bg-muted",
                )}
                aria-pressed={selected}
              >
                {m} min
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
