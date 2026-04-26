"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import type { OnboardingData, StepProps } from "../types";

type Assessment = NonNullable<OnboardingData["detailedAssessment"]>;

function useTimeState(totalSec: number | undefined) {
  return {
    h: useState(totalSec ? String(Math.floor(totalSec / 3600)) : ""),
    m: useState(totalSec ? String(Math.floor((totalSec % 3600) / 60)) : ""),
    s: useState(totalSec ? String(totalSec % 60) : ""),
  };
}

export function StepAssessment({ formData, updateFormData }: StepProps) {
  const a = formData.detailedAssessment ?? {};

  // 5K pace (mm:ss /km)
  const [paceMin, setPaceMin] = useState(a.run5kPaceSec ? String(Math.floor(a.run5kPaceSec / 60)) : "");
  const [paceSec, setPaceSec] = useState(a.run5kPaceSec ? String(a.run5kPaceSec % 60) : "");
  const [paceUnknown, setPaceUnknown] = useState(!a.run5kPaceSec);

  // Past Hyrox time (h:mm:ss)
  const [hasHyrox, setHasHyrox] = useState(!!a.pastHyroxTimeSec);
  const { h: [hyroxH, setHyroxH], m: [hyroxM, setHyroxM], s: [hyroxS, setHyroxS] } =
    useTimeState(a.pastHyroxTimeSec);

  // Deadlift opt-out
  const [dontLift, setDontLift] = useState(!a.deadliftKg);

  function patch(update: Partial<Assessment>) {
    updateFormData({ detailedAssessment: { ...a, ...update } });
  }

  function handlePace(field: "min" | "sec", val: string) {
    const m = field === "min" ? val : paceMin;
    const s = field === "sec" ? val : paceSec;
    if (field === "min") setPaceMin(val);
    else setPaceSec(val);
    const total = parseInt(m || "0", 10) * 60 + parseInt(s || "0", 10);
    patch({ run5kPaceSec: total > 0 ? total : undefined });
  }

  function handleHyroxTime(field: "h" | "m" | "s", val: string) {
    const h = field === "h" ? val : hyroxH;
    const m = field === "m" ? val : hyroxM;
    const s = field === "s" ? val : hyroxS;
    if (field === "h") setHyroxH(val);
    else if (field === "m") setHyroxM(val);
    else setHyroxS(val);
    const total = parseInt(h || "0", 10) * 3600 + parseInt(m || "0", 10) * 60 + parseInt(s || "0", 10);
    patch({ pastHyroxTimeSec: total > 0 ? total : undefined });
  }

  function numInput(key: keyof Assessment) {
    return {
      type: "number" as const,
      min: "0",
      placeholder: "0",
      value: (a[key] as number | undefined) ?? "",
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = parseFloat(e.target.value);
        patch({ [key]: isNaN(v) ? undefined : v });
      },
      className: "h-9 w-24 text-sm",
    };
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-[18px] font-medium">Let&apos;s calibrate your plan.</h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Answer what you can — skip anything you don&apos;t know.
        </p>
      </div>

      {/* 5K pace */}
      <Field label="5K run pace">
        {paceUnknown ? (
          <SkipLink onClick={() => setPaceUnknown(false)} label="+ Add pace" />
        ) : (
          <div className="flex items-center gap-2">
            <Input type="number" min="0" max="20" placeholder="05" value={paceMin}
              onChange={(e) => handlePace("min", e.target.value)} className="h-9 w-14 text-center text-sm" />
            <span className="text-muted-foreground">:</span>
            <Input type="number" min="0" max="59" placeholder="30" value={paceSec}
              onChange={(e) => handlePace("sec", e.target.value)} className="h-9 w-14 text-center text-sm" />
            <span className="text-[13px] text-muted-foreground">/km</span>
            <SkipLink onClick={() => { setPaceUnknown(true); patch({ run5kPaceSec: undefined }); }} label="Don't know" />
          </div>
        )}
      </Field>

      {/* Push-ups */}
      <Field label="Max push-ups (one set)">
        <InlineInput {...numInput("pushUpsMax")} unit="reps" />
      </Field>

      {/* Deadlift */}
      <Field label="Estimated deadlift max">
        {dontLift ? (
          <SkipLink onClick={() => setDontLift(false)} label="+ Add weight" />
        ) : (
          <div className="flex items-center gap-2">
            <Input {...numInput("deadliftKg")} />
            <span className="text-[13px] text-muted-foreground">kg</span>
            <SkipLink onClick={() => { setDontLift(true); patch({ deadliftKg: undefined }); }} label="Don't lift" />
          </div>
        )}
      </Field>

      {/* Pull-ups */}
      <Field label="Max pull-ups (one set)">
        <InlineInput {...numInput("pullUpsMax")} unit="reps" />
      </Field>

      {/* Past Hyrox */}
      <Field label="Past Hyrox attempts">
        <div className="flex gap-2">
          {(["First race", "Done it before"] as const).map((opt) => {
            const active = opt === "Done it before" ? hasHyrox : !hasHyrox;
            return (
              <button key={opt} type="button"
                onClick={() => {
                  const next = opt === "Done it before";
                  setHasHyrox(next);
                  if (!next) patch({ pastHyroxTimeSec: undefined });
                }}
                className={[
                  "rounded-lg border px-3 py-1.5 text-[13px] transition-colors",
                  active ? "border-primary bg-primary/5 font-medium" : "border-border hover:bg-secondary",
                ].join(" ")}
              >
                {opt}
              </button>
            );
          })}
        </div>
        {hasHyrox && (
          <div className="mt-2 flex items-center gap-1.5">
            <span className="text-[13px] text-muted-foreground">Best time:</span>
            {(
              [
                { state: hyroxH, set: setHyroxH, field: "h", ph: "1", max: 9, w: "w-12" },
                { state: hyroxM, set: setHyroxM, field: "m", ph: "30", max: 59, w: "w-14" },
                { state: hyroxS, set: setHyroxS, field: "s", ph: "00", max: 59, w: "w-14" },
              ] as const
            ).map(({ state, set, field, ph, max, w }, i) => (
              <span key={field} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-muted-foreground">:</span>}
                <Input type="number" min="0" max={max} placeholder={ph} value={state}
                  onChange={(e) => { set(e.target.value); handleHyroxTime(field as "h" | "m" | "s", e.target.value); }}
                  className={`h-9 ${w} text-center text-sm`} />
              </span>
            ))}
          </div>
        )}
      </Field>

      {/* Weekly running volume */}
      <Field label="Weekly running volume">
        <InlineInput {...numInput("weeklyRunKm")} unit="km / week" />
      </Field>

      {/* Strength sessions */}
      <Field label="Strength sessions per week">
        <InlineInput {...numInput("weeklyStrengthDays")} unit="/ week" />
      </Field>

      {/* Years training */}
      <Field label="Years of consistent training">
        <InlineInput {...numInput("yearsTraining")} unit="years" />
      </Field>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </div>
  );
}

function InlineInput({
  unit,
  ...inputProps
}: React.InputHTMLAttributes<HTMLInputElement> & { unit: string }) {
  return (
    <div className="flex items-center gap-2">
      <Input {...inputProps} />
      <span className="text-[13px] text-muted-foreground">{unit}</span>
    </div>
  );
}

function SkipLink({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick}
      className="ml-1 text-[12px] text-muted-foreground underline underline-offset-2 hover:text-foreground">
      {label}
    </button>
  );
}
