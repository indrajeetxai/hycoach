"use client";

import { useAction, useConvexAuth, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { PlanView } from "@/components/plan/PlanView";

const PHASES = [
  "Coach is reviewing your inputs",
  "Designing your weeks",
  "Finalizing your first session",
] as const;

const PHASE_DURATION_MS = 12_000; // ~36s of cycling — usually finishes mid-cycle

type Status =
  | { kind: "checking" }
  | { kind: "generating"; phase: number }
  | { kind: "ready" }
  | { kind: "error"; message: string };

export default function PlanPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const profile = useQuery(api.profiles.getProfile);
  const activePlan = useQuery(api.plans.getActivePlanWithEverything);
  const race = useQuery(api.races.getCurrentRace);
  const runPlanGeneration = useAction(
    api.actions.planGeneration.runPlanGeneration,
  );

  const [status, setStatus] = useState<Status>({ kind: "checking" });

  // Auth guard
  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/");
  }, [isAuthenticated, isLoading, router]);

  // Send users back to onboarding if they haven't completed it
  useEffect(() => {
    if (profile && (profile.onboardingStep ?? 0) < 9) {
      router.push("/onboarding");
    }
  }, [profile, router]);

  // Decide what to do once profile + activePlan have loaded
  useEffect(() => {
    if (profile === undefined || activePlan === undefined) return;
    if (!isAuthenticated) return;
    if (profile && (profile.onboardingStep ?? 0) < 9) return;

    if (activePlan) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus({ kind: "ready" });
      return;
    }

    // Only kick off generation once
    if (status.kind !== "checking") return;

    setStatus({ kind: "generating", phase: 0 });

    runPlanGeneration({})
      .then(() => router.push("/dashboard"))
      .catch((e: unknown) => {
        const message =
          e instanceof Error
            ? e.message
            : "Coach is having an off day. Try again.";
        setStatus({ kind: "error", message });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePlan, profile, isAuthenticated]);

  // Cycle through the phase copy while generating
  useEffect(() => {
    if (status.kind !== "generating") return;
    if (status.phase >= PHASES.length - 1) return;
    const t = setTimeout(() => {
      setStatus((s) =>
        s.kind === "generating" && s.phase < PHASES.length - 1
          ? { kind: "generating", phase: s.phase + 1 }
          : s,
      );
    }, PHASE_DURATION_MS);
    return () => clearTimeout(t);
  }, [status]);

  function retry() {
    setStatus({ kind: "generating", phase: 0 });
    runPlanGeneration({})
      .then(() => router.push("/dashboard"))
      .catch((e: unknown) => {
        const message =
          e instanceof Error
            ? e.message
            : "Coach is having an off day. Try again.";
        setStatus({ kind: "error", message });
      });
  }

  if (
    isLoading ||
    profile === undefined ||
    activePlan === undefined ||
    race === undefined
  ) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <span className="text-sm text-muted-foreground">Loading…</span>
      </div>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-12">
      <div className="w-full max-w-2xl">
        {(status.kind === "checking" || status.kind === "generating") && (
          <div className="rounded-2xl bg-secondary px-6 py-10">
            <h1 className="mb-6 text-[18px] font-medium">
              Coach is building your plan.
            </h1>
            <ul className="flex flex-col gap-3">
              {PHASES.map((label, i) => {
                const activePhase =
                  status.kind === "generating" ? status.phase : -1;
                const isDone = activePhase > i;
                const isActive = activePhase === i;
                return (
                  <li key={label} className="flex items-start gap-3">
                    <span
                      className={[
                        "mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px]",
                        isDone
                          ? "border-primary bg-primary text-primary-foreground"
                          : isActive
                            ? "border-primary text-primary"
                            : "border-border text-muted-foreground",
                      ].join(" ")}
                    >
                      {isDone ? "✓" : isActive ? "·" : ""}
                    </span>
                    <span
                      className={[
                        "text-[14px]",
                        isDone || isActive
                          ? "text-foreground"
                          : "text-muted-foreground",
                      ].join(" ")}
                    >
                      {label}
                      {isActive ? "…" : ""}
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-6 text-[12px] text-muted-foreground">
              This takes 30–60 seconds. Don&apos;t close the tab.
            </p>
          </div>
        )}

        {status.kind === "error" && (
          <div className="flex flex-col gap-4 rounded-2xl bg-secondary px-6 py-8">
            <div>
              <p className="text-[14px] font-medium">
                Coach is having an off day.
              </p>
              <p className="mt-1 text-[13px] text-muted-foreground">
                {status.message}
              </p>
            </div>
            <Button className="min-h-[44px] self-start" onClick={retry}>
              Try again
            </Button>
          </div>
        )}

        {status.kind === "ready" && activePlan && race && (
          <PlanView
            plan={activePlan}
            raceDate={race.raceDate}
            persona={profile?.coachPersona ?? "honest"}
          />
        )}
      </div>
    </main>
  );
}
