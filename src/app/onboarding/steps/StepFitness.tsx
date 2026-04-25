"use client";

import { useEffect } from "react";
import type { StepProps } from "../types";

type FitnessRating = "beginner" | "intermediate" | "advanced";

const OPTIONS: { value: FitnessRating; label: string; description: string }[] = [
  {
    value: "beginner",
    label: "Beginner",
    description: "New to structured training or Hyrox. Building your base.",
  },
  {
    value: "intermediate",
    label: "Intermediate",
    description: "Consistent training history. Done some races or events.",
  },
  {
    value: "advanced",
    label: "Advanced",
    description: "Competing regularly. Strong base in both strength and running.",
  },
];

export function StepFitness({ formData, updateFormData, onValidChange }: StepProps) {
  const selected = formData.fitnessRating;

  useEffect(() => {
    onValidChange(!!formData.fitnessRating);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function select(value: FitnessRating) {
    updateFormData({ fitnessRating: value });
    onValidChange(true);
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-[18px] font-medium">How would you rate your fitness?</h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Honest self-assessment leads to a better plan.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {OPTIONS.map(({ value, label, description }) => (
          <button
            key={value}
            type="button"
            onClick={() => select(value)}
            className={[
              "flex flex-col gap-1 rounded-xl border p-4 text-left transition-colors",
              selected === value
                ? "border-primary bg-primary/5"
                : "border-border bg-background hover:bg-secondary",
            ].join(" ")}
          >
            <span className="text-sm font-medium">{label}</span>
            <span className="text-[12px] text-muted-foreground">{description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
