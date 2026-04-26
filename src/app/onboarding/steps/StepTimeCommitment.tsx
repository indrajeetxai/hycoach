"use client";

import { useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import type { StepProps } from "../types";

const DAYS_MIN = 2;
const DAYS_MAX = 7;
const DAYS_DEFAULT = 4;

const MINUTE_OPTIONS = [30, 45, 60, 90, 120] as const;
const MINS_DEFAULT = 60;

export function StepTimeCommitment({ formData, updateFormData, onValidChange }: StepProps) {
  const days = formData.weeklyCommitmentDays ?? DAYS_DEFAULT;
  const mins = formData.minutesPerSession ?? MINS_DEFAULT;

  // Seed defaults on mount and mark step always valid
  useEffect(() => {
    updateFormData({
      weeklyCommitmentDays: formData.weeklyCommitmentDays ?? DAYS_DEFAULT,
      minutesPerSession: formData.minutesPerSession ?? MINS_DEFAULT,
    });
    onValidChange(true);
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
        <div className="flex items-baseline justify-between">
          <label className="text-sm font-medium">Days per week</label>
          <span className="text-[22px] font-semibold tabular-nums">
            {days}
            <span className="ml-1 text-[13px] font-normal text-muted-foreground">days</span>
          </span>
        </div>
        <Slider
          min={DAYS_MIN}
          max={DAYS_MAX}
          step={1}
          value={[days]}
          onValueChange={(vals) =>
            updateFormData({ weeklyCommitmentDays: (vals as number[])[0] })
          }
        />
        <div className="flex justify-between text-[11px] text-muted-foreground">
          <span>{DAYS_MIN} days</span>
          <span>{DAYS_MAX} days</span>
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
                    ? "border-primary bg-primary text-primary-foreground"
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
