"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { api } from "../../../convex/_generated/api";

export default function RealityCheckPage() {
  const router = useRouter();
  const { signOut } = useAuthActions();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const profile = useQuery(api.profiles.getProfile);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/");
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || profile === undefined) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <span className="text-sm text-muted-foreground">Loading…</span>
      </div>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Reality Check
        </p>
        <h1 className="mt-2 text-[20px] font-medium">Coming soon.</h1>
        <p className="mt-2 text-[13px] text-muted-foreground">
          D6 builds the real flow. Your onboarding is saved — Coach has everything needed to push back honestly on your goal.
        </p>
        <button
          onClick={() => void signOut()}
          className="mt-8 text-[12px] text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          Sign out (for testing)
        </button>
      </div>
    </main>
  );
}
