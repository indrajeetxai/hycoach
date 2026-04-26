"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { StepRaceDate } from "./steps/StepRaceDate";
import { StepDivision } from "./steps/StepDivision";
import { StepGoal } from "./steps/StepGoal";
import { StepTimeCommitment } from "./steps/StepTimeCommitment";
import { StepFitness } from "./steps/StepFitness";
import { StepAdaptiveDepth } from "./steps/StepAdaptiveDepth";
import { StepAssessment } from "./steps/StepAssessment";
import { StepEquipment } from "./steps/StepEquipment";
import { StepPersona } from "./steps/StepPersona";
import type { OnboardingData } from "./types";

const TOTAL_STEPS = 9;

const STEP_LABELS = [
  "Race date",
  "Division",
  "Goal",
  "Time commitment",
  "Fitness",
  "Plan depth",
  "Assessment",
  "Equipment",
  "Coach",
] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const profile = useQuery(api.profiles.getProfile);
  const setOnboardingStep = useMutation(api.profiles.setOnboardingStep);

  const completeOnboarding = useMutation(api.profiles.completeOnboarding);

  const [currentStep, setCurrentStep] = useState(0);
  const [initialized, setInitialized] = useState(false);
  const [formData, setFormData] = useState<Partial<OnboardingData>>({});
  const [canAdvance, setCanAdvance] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Resume from last saved step — or redirect if onboarding is already complete
  useEffect(() => {
    if (profile === undefined) return;
    if (!initialized) {
      if (
        profile?.onboardingStep !== undefined &&
        profile.onboardingStep >= TOTAL_STEPS
      ) {
        router.push("/reality-check");
        return;
      }
      if (profile?.onboardingStep !== undefined) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCurrentStep(profile.onboardingStep);
      }
      setInitialized(true);
    }
  }, [profile, initialized, router]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, isLoading, router]);

  // Placeholder steps (C3–C11) can always advance
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (currentStep !== 0) setCanAdvance(true);
    // Step 0 validity is managed by StepRaceDate via onValidChange
  }, [currentStep]);

  const updateFormData = useCallback((update: Partial<OnboardingData>) => {
    setFormData((prev) => ({ ...prev, ...update }));
  }, []);

  if (isLoading || profile === undefined) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <span className="text-sm text-muted-foreground">Loading…</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Already onboarded — render loading while the redirect-effect fires
  if (profile?.onboardingStep !== undefined && profile.onboardingStep >= TOTAL_STEPS) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <span className="text-sm text-muted-foreground">Loading…</span>
      </div>
    );
  }

  const progress = ((currentStep + 1) / TOTAL_STEPS) * 100;
  const isLastStep = currentStep === TOTAL_STEPS - 1;

  async function handleFinish() {
    if (
      !formData.raceDate ||
      !formData.goalType ||
      !formData.fitnessRating ||
      !formData.coachPersona ||
      formData.weeklyCommitmentDays === undefined ||
      formData.minutesPerSession === undefined ||
      !formData.equipmentAccess
    ) {
      setSubmitError("Some answers are missing. Go back and complete every step.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      await completeOnboarding({
        raceDate: formData.raceDate,
        registrationStatus: formData.registrationStatus,
        goalType: formData.goalType,
        targetTimeSec: formData.targetTimeSec,
        weeklyCommitmentDays: formData.weeklyCommitmentDays,
        minutesPerSession: formData.minutesPerSession,
        fitnessRating: formData.fitnessRating,
        detailedAssessment: formData.detailedAssessment,
        equipmentAccess: formData.equipmentAccess,
        coachPersona: formData.coachPersona,
      });
      router.push("/reality-check");
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Something went wrong. Try again.");
      setSubmitting(false);
    }
  }

  async function handleNext() {
    if (!canAdvance || submitting) return;

    if (isLastStep) {
      await handleFinish();
      return;
    }

    // Skip step 6 (detailed assessment) when user chose "skip" at step 5
    const next =
      currentStep === 5 && formData.adaptiveDepth === "skip"
        ? 7
        : Math.min(currentStep + 1, TOTAL_STEPS - 1);
    setCurrentStep(next);
    await setOnboardingStep({ step: next });
  }

  function handleBack() {
    setCurrentStep((s) => {
      // When going back from equipment (7) and assessment was skipped, return to depth question (5)
      if (s === 7 && formData.adaptiveDepth === "skip") return 5;
      return Math.max(0, s - 1);
    });
  }

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-8">
      <div className="w-full max-w-lg">

        {/* Progress bar */}
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Step {currentStep + 1} of {TOTAL_STEPS}
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              {STEP_LABELS[currentStep]}
            </span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step content */}
        <div className="min-h-[320px] rounded-2xl bg-secondary px-6 py-8">
          <StepContent
            step={currentStep}
            formData={formData}
            updateFormData={updateFormData}
            onValidChange={setCanAdvance}
          />
        </div>

        {/* Submission error */}
        {submitError && (
          <p className="mt-4 text-[13px] text-destructive" role="alert">
            {submitError}
          </p>
        )}

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between gap-3">
          {currentStep > 0 ? (
            <Button variant="ghost" onClick={handleBack} disabled={submitting}>
              ← Back
            </Button>
          ) : (
            <div />
          )}
          <Button
            className="min-h-[44px] px-8"
            disabled={!canAdvance || submitting}
            onClick={() => void handleNext()}
          >
            {submitting
              ? "Saving…"
              : isLastStep
                ? "Finish"
                : "Continue →"}
          </Button>
        </div>

      </div>
    </main>
  );
}

type StepContentProps = {
  step: number;
  formData: Partial<OnboardingData>;
  updateFormData: (update: Partial<OnboardingData>) => void;
  onValidChange: (valid: boolean) => void;
};

function StepContent({ step, formData, updateFormData, onValidChange }: StepContentProps) {
  if (step === 0) {
    return (
      <StepRaceDate
        formData={formData}
        updateFormData={updateFormData}
        onValidChange={onValidChange}
      />
    );
  }

  if (step === 1) {
    return (
      <StepDivision
        formData={formData}
        updateFormData={updateFormData}
        onValidChange={onValidChange}
      />
    );
  }

  if (step === 2) {
    return (
      <StepGoal
        formData={formData}
        updateFormData={updateFormData}
        onValidChange={onValidChange}
      />
    );
  }

  if (step === 3) {
    return (
      <StepTimeCommitment
        formData={formData}
        updateFormData={updateFormData}
        onValidChange={onValidChange}
      />
    );
  }

  if (step === 4) {
    return (
      <StepFitness
        formData={formData}
        updateFormData={updateFormData}
        onValidChange={onValidChange}
      />
    );
  }

  if (step === 5) {
    return (
      <StepAdaptiveDepth
        formData={formData}
        updateFormData={updateFormData}
        onValidChange={onValidChange}
      />
    );
  }

  if (step === 6) {
    return (
      <StepAssessment
        formData={formData}
        updateFormData={updateFormData}
        onValidChange={onValidChange}
      />
    );
  }

  if (step === 7) {
    return (
      <StepEquipment
        formData={formData}
        updateFormData={updateFormData}
        onValidChange={onValidChange}
      />
    );
  }

  if (step === 8) {
    return (
      <StepPersona
        formData={formData}
        updateFormData={updateFormData}
        onValidChange={onValidChange}
      />
    );
  }

  return null;
}
