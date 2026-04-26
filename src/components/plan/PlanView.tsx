"use client";

import { useState } from "react";
import type { FunctionReturnType } from "convex/server";
import type { api } from "../../../convex/_generated/api";

type FullPlan = NonNullable<
  FunctionReturnType<typeof api.plans.getActivePlanWithEverything>
>;
type FullWeek = FullPlan["weeks"][number];
type FullWorkout = FullWeek["workouts"][number];
type FullExercise = FullWorkout["exercises"][number];

const PERSONA_LABEL = {
  honest: "The Honest Coach",
  encourager: "The Encourager",
  operator: "The Operator",
} as const;

const PHASE_STYLES: Record<FullWeek["phase"], string> = {
  base: "bg-muted text-foreground",
  build: "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300",
  peak: "bg-[#534AB7]/10 text-[#534AB7] dark:bg-[#534AB7]/30 dark:text-[#b8b3ec]",
  taper:
    "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  race: "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300",
};

const STATUS_STYLES: Record<FullWeek["status"], string> = {
  current: "bg-primary text-primary-foreground",
  upcoming: "bg-transparent border border-border text-muted-foreground",
  done: "bg-muted text-muted-foreground",
};

const DAYS_PRD = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

function formatPace(secPerKm: number): string {
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatDuration(sec: number): string {
  if (sec < 60) return `${sec}s`;
  if (sec % 60 === 0) return `${sec / 60} min`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatPrescribed(p: FullExercise["prescribed"]): string {
  const parts: string[] = [];
  if (p.sets && p.reps) parts.push(`${p.sets}×${p.reps}`);
  else if (p.sets) parts.push(`${p.sets} sets`);
  else if (p.reps) parts.push(`${p.reps} reps`);
  if (p.distanceM !== undefined) {
    parts.push(p.distanceM >= 1000 ? `${p.distanceM / 1000}km` : `${p.distanceM}m`);
  }
  if (p.timeSec !== undefined) parts.push(formatDuration(p.timeSec));
  if (p.weightKg !== undefined) parts.push(`@ ${p.weightKg}kg`);
  if (p.paceSecPerKm !== undefined) parts.push(`@ ${formatPace(p.paceSecPerKm)}/km`);
  if (p.rpe !== undefined) parts.push(`RPE ${p.rpe}`);
  return parts.join(" · ");
}

function formatDateShort(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatDateLong(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function weekDateRange(startIso: string): string {
  const start = new Date(startIso);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return `${formatDateShort(start.toISOString())} – ${formatDateShort(end.toISOString())}`;
}

export function PlanView({
  plan,
  raceDate,
  persona,
}: {
  plan: FullPlan;
  raceDate: string;
  persona: "honest" | "encourager" | "operator";
}) {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Your plan
        </p>
        <h1 className="text-[20px] font-medium leading-tight">
          {plan.totalWeeks} weeks to {formatDateLong(raceDate)}.
        </h1>
        <p className="text-[12px] text-muted-foreground">
          Coached by {PERSONA_LABEL[persona]}.
        </p>
      </div>

      {/* Week list */}
      <div className="flex flex-col gap-2">
        {plan.weeks.map((week) => (
          <WeekCard
            key={week._id}
            week={week}
            defaultExpanded={week.status === "current"}
          />
        ))}
      </div>
    </div>
  );
}

function WeekCard({
  week,
  defaultExpanded = false,
}: {
  week: FullWeek;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const phaseStyle = PHASE_STYLES[week.phase];
  const statusStyle = STATUS_STYLES[week.status];
  const isCurrent = week.status === "current";
  const isDone = week.status === "done";

  return (
    <div
      className={[
        "overflow-hidden rounded-xl border bg-background transition-shadow",
        isCurrent
          ? "border-primary shadow-sm ring-1 ring-primary/40"
          : "border-border",
        isDone ? "opacity-70" : "",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        className="flex w-full items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-secondary sm:gap-3"
      >
        <span
          className={[
            "shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
            phaseStyle,
          ].join(" ")}
        >
          {week.phase}
        </span>
        <span
          className={[
            "shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider",
            statusStyle,
          ].join(" ")}
        >
          {week.status}
        </span>
        <span
          className={[
            "text-sm font-medium",
            isDone ? "text-muted-foreground" : "",
          ].join(" ")}
        >
          Week {week.weekNumber}
        </span>
        <span className="ml-auto hidden text-[12px] text-muted-foreground sm:inline">
          {weekDateRange(week.startDate)}
        </span>
        <span
          className={[
            "ml-auto shrink-0 text-[12px] text-muted-foreground transition-transform sm:ml-2",
            expanded ? "rotate-90" : "",
          ].join(" ")}
          aria-hidden
        >
          ›
        </span>
      </button>

      {expanded && (
        <div className="flex flex-col gap-4 border-t border-border bg-secondary/40 px-4 py-4">
          {/* Reasoning */}
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Why this week
            </p>
            <p className="text-[13px] leading-relaxed text-foreground">
              {week.reasoning}
            </p>
          </div>

          {/* Coach note */}
          <blockquote className="rounded-md border-l-2 border-foreground bg-background px-3 py-2 text-[13px] italic leading-snug text-foreground">
            {week.coachNote}
          </blockquote>

          {/* Workouts */}
          <div className="flex flex-col gap-2">
            {week.workouts.map((workout) => (
              <WorkoutCard key={workout._id} workout={workout} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function WorkoutCard({ workout }: { workout: FullWorkout }) {
  const isRest = workout.type === "rest";
  return (
    <div
      className={[
        "rounded-md border px-3 py-2.5",
        isRest ? "border-dashed border-border bg-background" : "border-border bg-background",
      ].join(" ")}
    >
      <div className="flex items-start gap-2">
        <span className="mt-[2px] w-9 shrink-0 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {DAYS_PRD[workout.dayOfWeek] ?? "?"}
        </span>
        <span className="mt-[2px] shrink-0 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {workout.type}
        </span>
        <span className="min-w-0 flex-1 text-sm font-medium break-words">
          {workout.title}
        </span>
        {!isRest && (
          <span className="mt-[2px] shrink-0 text-[11px] text-muted-foreground">
            {workout.durationMin} min
          </span>
        )}
      </div>

      {!isRest && workout.whyThisWorkout && (
        <p className="mt-1 pl-11 text-[12px] text-muted-foreground">
          {workout.whyThisWorkout}
        </p>
      )}

      {workout.exercises.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1 pl-11">
          {workout.exercises.map((ex) => (
            <li
              key={ex._id}
              className="flex flex-wrap items-baseline gap-x-2 text-[12px]"
            >
              <span className="font-medium text-foreground">
                {ex.name}
                {ex.isSubstitute && (
                  <span className="ml-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                    sub
                  </span>
                )}
              </span>
              <span className="text-muted-foreground">
                {formatPrescribed(ex.prescribed)}
              </span>
              {ex.prescribed.notes && (
                <span className="text-[11px] italic text-muted-foreground">
                  — {ex.prescribed.notes}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
