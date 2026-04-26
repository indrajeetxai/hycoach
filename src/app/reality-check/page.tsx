"use client";

import { useAction, useConvexAuth, useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";

type Suggestion = {
  type: "increase_days" | "increase_minutes" | "adjust_goal" | "extend_timeline";
  from: unknown;
  to: unknown;
  rationale: string;
};

type RealityCheckResult = {
  feasible: boolean;
  verdict: string;
  suggestions: Suggestion[];
};

type Status =
  | { kind: "loading" }
  | { kind: "result"; data: RealityCheckResult }
  | { kind: "error"; message: string };

const PERSONA_LABEL: Record<"honest" | "encourager" | "operator", string> = {
  honest: "The Honest Coach",
  encourager: "The Encourager",
  operator: "The Operator",
};

function suggestionLabel(s: Suggestion): string {
  const fmt = (v: unknown) => (typeof v === "number" ? String(v) : String(v));
  switch (s.type) {
    case "increase_days":
      return `Train ${fmt(s.from)} → ${fmt(s.to)} days/week`;
    case "increase_minutes":
      return `Sessions: ${fmt(s.from)} → ${fmt(s.to)} minutes`;
    case "adjust_goal":
      return `Switch goal: ${fmt(s.from)} → ${fmt(s.to)}`;
    case "extend_timeline":
      return `Push race ${fmt(s.from)} → ${fmt(s.to)} weeks`;
  }
}

export default function RealityCheckPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const profile = useQuery(api.profiles.getProfile);
  const runRealityCheck = useAction(api.actions.realityCheck.runRealityCheck);
  const applyAdjustment = useMutation(api.realityCheck.applyAdjustment);

  const [status, setStatus] = useState<Status>({ kind: "loading" });

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

  // Call Reality Check on mount
  useEffect(() => {
    if (!isAuthenticated || profile === undefined) return;
    if (profile && (profile.onboardingStep ?? 0) < 9) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatus({ kind: "loading" });
    runRealityCheck({})
      .then((data) => {
        if (!cancelled) setStatus({ kind: "result", data });
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          const message =
            e instanceof Error ? e.message : "Coach is having an off day. Try again.";
          setStatus({ kind: "error", message });
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, profile?.onboardingStep]);

  if (isLoading || profile === undefined) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <span className="text-sm text-muted-foreground">Loading…</span>
      </div>
    );
  }
  if (!isAuthenticated || !profile || (profile.onboardingStep ?? 0) < 9) {
    return null;
  }

  const personaLabel = PERSONA_LABEL[profile.coachPersona ?? "honest"];

  function retry() {
    setStatus({ kind: "loading" });
    runRealityCheck({})
      .then((data) => setStatus({ kind: "result", data }))
      .catch((e: unknown) => {
        const message =
          e instanceof Error ? e.message : "Coach is having an off day. Try again.";
        setStatus({ kind: "error", message });
      });
  }

  function handleProceed() {
    router.push("/plan");
  }

  async function handleSuggestionClick(s: Suggestion) {
    const to = s.to;
    if (typeof to !== "string" && typeof to !== "number") {
      setStatus({
        kind: "error",
        message: `Coach gave a suggestion with an unexpected value (${JSON.stringify(to)}). Try again.`,
      });
      return;
    }
    setStatus({ kind: "loading" });
    try {
      await applyAdjustment({ type: s.type, to });
      const data = await runRealityCheck({});
      setStatus({ kind: "result", data });
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Could not apply that adjustment.";
      setStatus({ kind: "error", message });
    }
  }

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-12">
      <div className="w-full max-w-xl">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Reality Check
        </p>
        <p className="mb-6 text-[12px] text-muted-foreground">
          {personaLabel} is reading your numbers.
        </p>

        {status.kind === "loading" && (
          <div className="rounded-2xl bg-secondary px-6 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              Coach is checking the math…
            </p>
          </div>
        )}

        {status.kind === "error" && (
          <div className="flex flex-col gap-4 rounded-2xl bg-secondary px-6 py-8">
            <div>
              <p className="text-[14px] font-medium">Coach is having an off day.</p>
              <p className="mt-1 text-[13px] text-muted-foreground">
                {status.message}
              </p>
            </div>
            <Button className="min-h-[44px] self-start" onClick={retry}>
              Try again
            </Button>
          </div>
        )}

        {status.kind === "result" && (
          <div className="flex flex-col gap-5">
            {/* Verdict */}
            <blockquote
              className={[
                "rounded-2xl border-l-2 px-5 py-5",
                status.data.feasible
                  ? "border-green-600 bg-green-50 dark:bg-green-950/20"
                  : "border-amber-500 bg-amber-50 dark:bg-amber-950/20",
              ].join(" ")}
            >
              <p className="whitespace-pre-line text-[14px] leading-relaxed text-foreground">
                {status.data.verdict}
              </p>
              <p className="mt-3 text-[11px] uppercase tracking-widest text-muted-foreground">
                — {personaLabel}
              </p>
            </blockquote>

            {/* Suggestions (only when infeasible / Coach offered options) */}
            {status.data.suggestions.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Options
                </p>
                {status.data.suggestions.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSuggestionClick(s)}
                    className="flex flex-col gap-1 rounded-xl border border-border bg-background p-4 text-left transition-colors hover:bg-secondary"
                  >
                    <span className="text-sm font-medium">
                      {suggestionLabel(s)}
                    </span>
                    <span className="text-[12px] text-muted-foreground">
                      {s.rationale}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Primary CTA */}
            <div className="flex justify-end pt-2">
              <Button className="min-h-[44px] px-8" onClick={handleProceed}>
                {status.data.feasible
                  ? "Build my plan →"
                  : "Continue anyway →"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
