"use client";

import { useEffect } from "react";
import type { StepProps } from "../types";

type Depth = "detailed" | "skip";

export function StepAdaptiveDepth({ formData, updateFormData }: StepProps) {
  const selected = formData.adaptiveDepth;
  const isShortPath = formData.raceDatePath === "short";

  // Short path: force detailed
  useEffect(() => {
    if (isShortPath) {
      updateFormData({ adaptiveDepth: "detailed" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function select(value: Depth) {
    updateFormData({ adaptiveDepth: value });
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-[18px] font-medium">How accurate do you want your plan?</h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          More data = more precise week-by-week structure.
        </p>
      </div>

      {isShortPath && (
        <div className="rounded-md border-l-2 border-amber-500 bg-amber-50 px-3 py-2.5 text-[13px] text-amber-700 dark:bg-amber-950/20 dark:text-amber-400">
          Less than 4 weeks to your race — we&apos;ll use the detailed assessment to build the most accurate plan possible.
        </div>
      )}

      <div className="flex flex-col gap-3">
        {/* Detailed */}
        <button
          type="button"
          disabled={false}
          onClick={() => select("detailed")}
          className={[
            "flex flex-col gap-1 rounded-xl border p-4 text-left transition-colors",
            selected === "detailed"
              ? "border-primary bg-primary/5"
              : "border-border bg-background hover:bg-secondary",
          ].join(" ")}
        >
          <span className="text-sm font-medium">Take 2 minutes</span>
          <span className="text-[12px] text-muted-foreground">
            Answer 8 quick questions. Better data means a more accurate plan.
          </span>
        </button>

        {/* Skip */}
        <button
          type="button"
          disabled={isShortPath}
          onClick={() => !isShortPath && select("skip")}
          className={[
            "flex flex-col gap-1 rounded-xl border p-4 text-left transition-colors",
            isShortPath
              ? "cursor-not-allowed opacity-40"
              : selected === "skip"
                ? "border-primary bg-primary/5"
                : "border-border bg-background hover:bg-secondary",
          ].join(" ")}
        >
          <span className="text-sm font-medium">Skip ahead</span>
          <span className="text-[12px] text-muted-foreground">
            We&apos;ll calibrate from your fitness rating alone.
          </span>
        </button>
      </div>
    </div>
  );
}
