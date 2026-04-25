"use client";

import { useEffect } from "react";
import type { StepProps } from "../types";

export function StepDivision({ updateFormData, onValidChange }: StepProps) {
  // Singles is the only available option — auto-select on mount
  useEffect(() => {
    updateFormData({ division: "singles" });
    onValidChange(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-[18px] font-medium">Which division?</h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          v1 supports Singles. Doubles support is coming.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        {/* Singles — enabled, selected */}
        <div className="flex flex-1 cursor-default flex-col gap-1 rounded-xl border border-primary bg-primary/5 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Singles</span>
            <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
              Selected
            </span>
          </div>
          <p className="text-[12px] text-muted-foreground">
            Solo race. Your plan, your times.
          </p>
        </div>

        {/* Doubles — disabled */}
        <div className="flex flex-1 cursor-not-allowed flex-col gap-1 rounded-xl border border-border bg-background p-4 opacity-50">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Doubles</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
              Coming in v2
            </span>
          </div>
          <p className="text-[12px] text-muted-foreground">
            Two athletes, one combined time.
          </p>
        </div>
      </div>
    </div>
  );
}
