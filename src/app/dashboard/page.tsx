"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery } from "convex/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { api } from "../../../convex/_generated/api";

const PERSONA_LABEL = {
  honest: "The Honest Coach",
  encourager: "The Encourager",
  operator: "The Operator",
} as const;

const DAYS_PRD = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

function todayIso(): string {
  return new Date().toISOString().split("T")[0];
}

function daysBetween(fromIso: string, toIso: string): number {
  const ms =
    new Date(`${toIso}T00:00:00Z`).getTime() -
    new Date(`${fromIso}T00:00:00Z`).getTime();
  return Math.round(ms / (24 * 60 * 60 * 1000));
}

function weeksUntil(targetIso: string): number {
  return Math.max(0, Math.ceil(daysBetween(todayIso(), targetIso) / 7));
}

function formatPace(secPerKm: number): string {
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatDuration(sec: number): string {
  if (sec < 60) return `${sec}s`;
  if (sec % 60 === 0) return `${sec / 60} min`;
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

function formatPrescribed(p: {
  sets?: number;
  reps?: number;
  timeSec?: number;
  distanceM?: number;
  weightKg?: number;
  paceSecPerKm?: number;
  rpe?: number;
  notes?: string;
}): string {
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

function formatLong(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default function DashboardPage() {
  const router = useRouter();
  const { signOut } = useAuthActions();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const profile = useQuery(api.profiles.getProfile);
  const race = useQuery(api.races.getCurrentRace);
  const plan = useQuery(api.plans.getActivePlanWithEverything);

  // Auth guard
  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/");
  }, [isAuthenticated, isLoading, router]);

  // Onboarding guard
  useEffect(() => {
    if (profile && (profile.onboardingStep ?? 0) < 9) {
      router.push("/onboarding");
    }
  }, [profile, router]);

  // No plan yet → send to Reality Check (which leads to plan generation)
  useEffect(() => {
    if (!isAuthenticated) return;
    if (profile === undefined || plan === undefined) return;
    if (profile && (profile.onboardingStep ?? 0) < 9) return;
    if (plan === null) {
      router.push("/reality-check");
    }
  }, [isAuthenticated, profile, plan, router]);

  if (
    isLoading ||
    profile === undefined ||
    race === undefined ||
    plan === undefined
  ) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <span className="text-sm text-muted-foreground">Loading…</span>
      </div>
    );
  }
  if (
    !isAuthenticated ||
    !profile ||
    (profile.onboardingStep ?? 0) < 9 ||
    !plan ||
    !race
  ) {
    return null; // a redirect-effect is firing
  }

  const today = todayIso();
  const allWorkouts = plan.weeks.flatMap((w) => w.workouts);
  const todayWorkout = allWorkouts.find((w) => w.scheduledDate === today);

  // Find next workout if today is a rest day or pre-plan
  const upcomingWorkouts = allWorkouts
    .filter((w) => w.scheduledDate >= today && w.type !== "rest")
    .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
  const nextWorkout = todayWorkout?.type === "rest"
    ? upcomingWorkouts.find((w) => w.scheduledDate > today)
    : upcomingWorkouts[0];

  const lastWeek = plan.weeks[plan.weeks.length - 1];
  const planEndIso = (() => {
    const d = new Date(`${lastWeek.startDate}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + 6);
    return d.toISOString().split("T")[0];
  })();
  const planComplete = today > planEndIso;
  const planNotStarted = today < plan.startDate;

  const personaLabel = PERSONA_LABEL[profile.coachPersona ?? "honest"];
  const wksToRace = weeksUntil(race.raceDate);
  const daysToRace = daysBetween(today, race.raceDate);

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-8">
      <div className="flex w-full max-w-xl flex-col gap-6">
        {/* Top bar */}
        <div className="flex items-baseline justify-between">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Dashboard
          </p>
          <button
            onClick={() => void signOut()}
            className="text-[12px] text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Sign out
          </button>
        </div>

        {/* Race counter */}
        <div className="flex flex-col gap-1">
          <h1 className="text-[22px] font-medium leading-tight">
            {wksToRace > 0
              ? `${wksToRace} week${wksToRace === 1 ? "" : "s"} to race day.`
              : daysToRace > 0
                ? `${daysToRace} day${daysToRace === 1 ? "" : "s"} to race day.`
                : daysToRace === 0
                  ? "Race day."
                  : "Race day has passed."}
          </h1>
          <p className="text-[12px] text-muted-foreground">
            {formatLong(race.raceDate)} · Coached by {personaLabel}
          </p>
        </div>

        {/* Today's card */}
        {planNotStarted && (
          <div className="rounded-2xl border border-border bg-secondary/40 px-5 py-5">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Plan starts {formatLong(plan.startDate)}
            </p>
            <p className="mt-2 text-[14px] text-foreground">
              See you on day one. Until then, rest up.
            </p>
          </div>
        )}

        {!planNotStarted && !planComplete && todayWorkout && todayWorkout.type !== "rest" && (
          <WorkoutHeroCard workout={todayWorkout} dateLabel="Today" />
        )}

        {!planNotStarted && !planComplete && todayWorkout && todayWorkout.type === "rest" && (
          <div className="flex flex-col gap-4 rounded-2xl border border-dashed border-border bg-secondary/40 px-5 py-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Today · {DAYS_PRD[todayWorkout.dayOfWeek]} {formatLong(today).split(",")[0]}
              </p>
              <p className="mt-1 text-[16px] font-medium">Rest day.</p>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Sleep well. Hydrate. Easy walk if you feel like it.
              </p>
            </div>
            {nextWorkout && (
              <div className="border-t border-border pt-3">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Tomorrow
                </p>
                <p className="mt-1 text-sm font-medium">{nextWorkout.title}</p>
                <p className="text-[12px] text-muted-foreground">
                  {nextWorkout.durationMin} min · {nextWorkout.type}
                </p>
              </div>
            )}
          </div>
        )}

        {!planNotStarted && !planComplete && !todayWorkout && nextWorkout && (
          <div className="rounded-2xl border border-border bg-secondary/40 px-5 py-5">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Next session · {formatLong(nextWorkout.scheduledDate)}
            </p>
            <p className="mt-2 text-sm font-medium">{nextWorkout.title}</p>
            <p className="text-[12px] text-muted-foreground">
              {nextWorkout.durationMin} min · {nextWorkout.type}
            </p>
          </div>
        )}

        {planComplete && (
          <div className="rounded-2xl border-l-2 border-green-600 bg-green-50 px-5 py-5 dark:bg-green-950/20">
            <p className="text-[14px] font-medium">Plan complete.</p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              The plan window has ended. Reflection and next-race setup land in v1.1.
            </p>
          </div>
        )}

        {/* Footer link to plan view */}
        <Link
          href="/plan"
          className="self-start text-[13px] font-medium underline underline-offset-4 transition-colors hover:text-foreground"
        >
          View full plan →
        </Link>

        {/* Logging-coming-soon hint */}
        <p className="text-[11px] text-muted-foreground">
          v0.7 will let you log workouts. For now, this is read-only.
        </p>
      </div>
    </main>
  );
}

function WorkoutHeroCard({
  workout,
  dateLabel,
}: {
  workout: {
    type: "run" | "strength" | "hyrox" | "hybrid" | "rest";
    title: string;
    durationMin: number;
    whyThisWorkout: string;
    scheduledDate: string;
    dayOfWeek: number;
    exercises: Array<{
      _id: string;
      name: string;
      hyroxStation?: string;
      isSubstitute: boolean;
      prescribed: {
        sets?: number;
        reps?: number;
        timeSec?: number;
        distanceM?: number;
        weightKg?: number;
        paceSecPerKm?: number;
        rpe?: number;
        notes?: string;
      };
    }>;
  };
  dateLabel: string;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-primary bg-background px-5 py-5 ring-1 ring-primary/40">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          {dateLabel} · {DAYS_PRD[workout.dayOfWeek] ?? "?"} · {workout.type}
        </p>
        <h2 className="mt-1 text-[18px] font-medium leading-tight">
          {workout.title}
        </h2>
        <p className="mt-1 text-[12px] text-muted-foreground">
          {workout.durationMin} min
        </p>
      </div>
      <p className="text-[13px] leading-relaxed text-foreground">
        {workout.whyThisWorkout}
      </p>
      {workout.exercises.length > 0 && (
        <ul className="flex flex-col gap-1 border-t border-border pt-3">
          {workout.exercises.map((ex) => (
            <li
              key={ex._id}
              className="flex flex-wrap items-baseline gap-x-2 text-[13px]"
            >
              <span className="font-medium">
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
