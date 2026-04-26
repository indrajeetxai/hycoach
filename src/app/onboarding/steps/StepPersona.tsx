"use client";

import type { StepProps } from "../types";

type Persona = "honest" | "encourager" | "operator";

const OPTIONS: {
  value: Persona;
  label: string;
  isDefault?: boolean;
  voice: string;
  example: string;
}[] = [
  {
    value: "honest",
    label: "The Honest Coach",
    isDefault: true,
    voice: "Direct, warm, no sugarcoating. Treats you like an adult.",
    example: "You missed three sessions. Here's how we recover.",
  },
  {
    value: "encourager",
    label: "The Encourager",
    voice: "Supportive, growth-mindset, celebrates resets.",
    example: "Three off, three to come. You're still in this — let's reset.",
  },
  {
    value: "operator",
    label: "The Operator",
    voice: "Intense, no-nonsense, race-day mindset.",
    example: "Three missed. Race won't wait. Lock in.",
  },
];

export function StepPersona({ formData, updateFormData }: StepProps) {
  const selected = formData.coachPersona;

  function select(value: Persona) {
    updateFormData({ coachPersona: value });
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-[18px] font-medium">Pick your Coach.</h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Same plan, same logic — different voice. Switchable later in settings.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {OPTIONS.map(({ value, label, isDefault, voice, example }) => {
          const isSelected = selected === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => select(value)}
              className={[
                "flex flex-col gap-2 rounded-xl border p-4 text-left transition-colors",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border bg-background hover:bg-secondary",
              ].join(" ")}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{label}</span>
                {isDefault && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    default
                  </span>
                )}
              </div>
              <p className="text-[12px] text-muted-foreground">{voice}</p>
              <p
                className={[
                  "rounded-md border-l-2 px-3 py-2 text-[12px] italic leading-snug",
                  isSelected
                    ? "border-primary bg-primary/10"
                    : "border-border bg-secondary",
                ].join(" ")}
              >
                &ldquo;{example}&rdquo;
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
