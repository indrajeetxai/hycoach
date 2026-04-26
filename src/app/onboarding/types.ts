export type RaceDatePath = "standard" | "short" | "long";

export type OnboardingData = {
  // C2
  raceDate?: string;
  raceDatePath?: RaceDatePath;
  registrationStatus?: "registered" | "considering";
  selectedWeeks?: 12 | 16 | 20 | 24 | 52;
  // C3
  division?: "singles";
  // C4
  goalType?: "finish" | "target";
  targetTimeSec?: number;
  // C5
  weeklyCommitmentDays?: number;
  minutesPerSession?: number;
  // C6
  fitnessRating?: "beginner" | "intermediate" | "advanced";
  // C7
  adaptiveDepth?: "detailed" | "skip";
  // C8
  detailedAssessment?: {
    run5kPaceSec?: number;
    pushUpsMax?: number;
    deadliftKg?: number;
    pullUpsMax?: number;
    pastHyroxTimeSec?: number;
    weeklyRunKm?: number;
    weeklyStrengthDays?: number;
    yearsTraining?: number;
  };
  // C9
  equipmentAccess?: {
    sled: boolean;
    wallBall: boolean;
    skiErg: boolean;
    rower: boolean;
  };
  // C10
  coachPersona?: "honest" | "encourager" | "operator";
};

export type StepProps = {
  formData: Partial<OnboardingData>;
  updateFormData: (update: Partial<OnboardingData>) => void;
};
