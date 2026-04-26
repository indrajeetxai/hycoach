"use client";

import { Fragment, useState } from "react";
import { Input } from "@/components/ui/input";
import type { StepProps } from "../types";

type GoalType = "finish" | "target";

function toSeconds(h: string, m: string, s: string): number {
  return (
    parseInt(h || "0", 10) * 3600 +
    parseInt(m || "0", 10) * 60 +
    parseInt(s || "0", 10)
  );
}

function isTimeValid(h: string, m: string, s: string): boolean {
  if (parseInt(m || "0", 10) > 59 || parseInt(s || "0", 10) > 59) return false;
  return toSeconds(h, m, s) > 0;
}

export function StepGoal({ formData, updateFormData }: StepProps) {
  const goalType = formData.goalType;

  const [hours, setHours] = useState(() => {
    if (!formData.targetTimeSec) return "";
    return String(Math.floor(formData.targetTimeSec / 3600));
  });
  const [minutes, setMinutes] = useState(() => {
    if (!formData.targetTimeSec) return "";
    return String(Math.floor((formData.targetTimeSec % 3600) / 60));
  });
  const [seconds, setSeconds] = useState(() => {
    if (!formData.targetTimeSec) return "";
    return String(formData.targetTimeSec % 60);
  });

  function selectGoalType(type: GoalType) {
    updateFormData({
      goalType: type,
      targetTimeSec: type === "finish" ? undefined : formData.targetTimeSec,
    });
  }

  function handleTimeChange(field: "hours" | "minutes" | "seconds", value: string) {
    const h = field === "hours" ? value : hours;
    const m = field === "minutes" ? value : minutes;
    const s = field === "seconds" ? value : seconds;

    if (field === "hours") setHours(value);
    if (field === "minutes") setMinutes(value);
    if (field === "seconds") setSeconds(value);

    const valid = isTimeValid(h, m, s);
    updateFormData({ targetTimeSec: valid ? toSeconds(h, m, s) : undefined });
  }

  const showRangeError =
    parseInt(minutes || "0", 10) > 59 || parseInt(seconds || "0", 10) > 59;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-[18px] font-medium">What&apos;s your goal?</h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Be honest — Coach adjusts the plan to fit.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => selectGoalType("finish")}
          className={[
            "flex flex-1 flex-col gap-1 rounded-xl border p-4 text-left transition-colors",
            goalType === "finish"
              ? "border-primary bg-primary/5"
              : "border-border bg-background hover:bg-secondary",
          ].join(" ")}
        >
          <span className="text-sm font-medium">Just finish</span>
          <span className="text-[12px] text-muted-foreground">
            Complete the race. No time pressure.
          </span>
        </button>

        <button
          type="button"
          onClick={() => selectGoalType("target")}
          className={[
            "flex flex-1 flex-col gap-1 rounded-xl border p-4 text-left transition-colors",
            goalType === "target"
              ? "border-primary bg-primary/5"
              : "border-border bg-background hover:bg-secondary",
          ].join(" ")}
        >
          <span className="text-sm font-medium">Target time</span>
          <span className="text-[12px] text-muted-foreground">
            A specific finish time to train toward.
          </span>
        </button>
      </div>

      {goalType === "target" && (
        <div className="flex flex-col gap-2">
          <p className="text-[13px] text-muted-foreground">Target finish time</p>
          <div className="flex items-center gap-2">
            {(
              [
                { field: "hours", value: hours, setter: setHours, label: "hrs", max: 9 },
                { field: "minutes", value: minutes, setter: setMinutes, label: "min", max: 59 },
                { field: "seconds", value: seconds, setter: setSeconds, label: "sec", max: 59 },
              ] as const
            ).map(({ field, value, label, max }, i) => (
              <Fragment key={field}>
                {i > 0 && (
                  <span className="mb-5 text-lg text-muted-foreground">:</span>
                )}
                <div className="flex flex-col items-center gap-1">
                  <Input
                    type="number"
                    min="0"
                    max={max}
                    placeholder="00"
                    value={value}
                    onChange={(e) =>
                      handleTimeChange(
                        field as "hours" | "minutes" | "seconds",
                        e.target.value
                      )
                    }
                    className="h-11 w-16 text-center text-sm"
                  />
                  <span className="text-[11px] text-muted-foreground">{label}</span>
                </div>
              </Fragment>
            ))}
          </div>

          {showRangeError && (
            <p className="text-[13px] text-destructive">
              Minutes and seconds must be between 0 and 59.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
