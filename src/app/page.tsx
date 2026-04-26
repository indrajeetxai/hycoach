"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GoogleIcon } from "@/components/landing/GoogleIcon";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { SamplePlan } from "@/components/landing/SamplePlan";
import { Faq } from "@/components/landing/Faq";
import { FinalCta } from "@/components/landing/FinalCta";
import { Footer } from "@/components/landing/Footer";


const WEEK_DAYS = [
  { day: "Mon", type: "Strength", variant: "default" },
  { day: "Tue", type: "Threshold", variant: "default" },
  { day: "Wed", type: "Rest", variant: "rest" },
  { day: "Thu", type: "Hybrid", variant: "hybrid" },
  { day: "Fri", type: "Easy run", variant: "default" },
  { day: "Sat", type: "Strength", variant: "default" },
  { day: "Sun", type: "Rest", variant: "rest" },
] as const;

type WaitlistStatus = "idle" | "loading" | "joined" | "exists" | "error";

export default function Home() {
  const router = useRouter();
  const { signIn } = useAuthActions();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const joinWaitlist = useMutation(api.waitlist.joinWaitlist);

  const [showWaitlist, setShowWaitlist] = useState(false);
  const [email, setEmail] = useState("");
  const [waitlistStatus, setWaitlistStatus] = useState<WaitlistStatus>("idle");

  async function handleNotify(e: { preventDefault(): void }) {
    e.preventDefault();
    setWaitlistStatus("loading");
    try {
      const result = await joinWaitlist({ email, source: "landing_hero" });
      setWaitlistStatus(result.joined ? "joined" : "exists");
    } catch {
      setWaitlistStatus("error");
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <span className="text-sm text-muted-foreground">Loading…</span>
      </div>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-5xl">
        <div className="grid grid-cols-1 gap-8 rounded-2xl bg-secondary px-4 py-8 md:grid-cols-[1.2fr_1fr] md:px-8">

          {/* Left column: copy + CTAs */}
          <div className="flex flex-col justify-center gap-5">
            <h1
              className="text-foreground"
              style={{
                fontSize: "clamp(28px, 4vw, 32px)",
                fontWeight: 500,
                letterSpacing: "-0.5px",
                lineHeight: 1.1,
                fontFeatureSettings: '"ss01"',
                animation: "fadeUp 0.4s ease-out both",
                animationDelay: "0ms",
              }}
            >
              Your personal Hyrox coach.
            </h1>

            <p
              className="max-w-sm text-muted-foreground"
              style={{
                fontSize: "15px",
                lineHeight: 1.6,
                animation: "fadeUp 0.4s ease-out both",
                animationDelay: "80ms",
              }}
            >
              You set the race goal. Coach builds the plan — then keeps reshaping it every week, based on how training is actually going. Because real life is messy.
            </p>

            <div
              className="flex flex-col gap-3"
              style={{
                animation: "fadeUp 0.4s ease-out both",
                animationDelay: "160ms",
              }}
            >
              {isAuthenticated ? (
                <Button size="lg" className="min-h-[44px]" onClick={() => router.push("/dashboard")}>
                  Go to your plan →
                </Button>
              ) : (
                <>
                  <Button
                    size="lg"
                    className="min-h-[44px] gap-2"
                    onClick={() => void signIn("google", { redirectTo: "/onboarding" })}
                  >
                    <GoogleIcon />
                    Sign in with Google
                  </Button>

                  {!showWaitlist ? (
                    <button
                      onClick={() => setShowWaitlist(true)}
                      className="py-3 text-left text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Not ready yet? Join the waitlist →
                    </button>
                  ) : waitlistStatus === "joined" ? (
                    <p className="text-sm text-green-600 dark:text-green-400">
                      You&apos;re on the list. We&apos;ll be in touch.
                    </p>
                  ) : waitlistStatus === "exists" ? (
                    <p className="text-sm text-muted-foreground">
                      You&apos;re already on the list.
                    </p>
                  ) : (
                    <form
                      onSubmit={handleNotify}
                      className="flex gap-2"
                      style={{ animation: "expandIn 0.2s ease-out both" }}
                    >
                      <Input
                        type="email"
                        placeholder="you@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="h-9 text-sm"
                      />
                      <Button
                        type="submit"
                        size="sm"
                        className="min-h-[44px]"
                        variant="outline"
                        disabled={waitlistStatus === "loading"}
                      >
                        {waitlistStatus === "loading" ? "…" : "Notify me"}
                      </Button>
                    </form>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Right column: week grid card */}
          <div
            className="flex flex-col gap-3 rounded-xl border bg-background p-4"
            style={{
              animation: "fadeUp 0.4s ease-out both",
              animationDelay: "240ms",
            }}
          >
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Week 5 · Build
            </p>

            <div className="grid grid-cols-7 gap-1">
              {WEEK_DAYS.map(({ day, type, variant }) => (
                <div
                  key={day}
                  className={[
                    "flex flex-col items-center gap-0.5 rounded-md px-0.5 py-1.5",
                    variant === "hybrid"
                      ? "bg-[#534AB7] text-white"
                      : variant === "rest"
                        ? "bg-muted text-muted-foreground"
                        : "bg-muted/50 text-foreground",
                  ].join(" ")}
                >
                  <span className="text-[9px] font-semibold uppercase tracking-wide">
                    {day}
                  </span>
                  <span className="text-center text-[8px] leading-tight opacity-80">
                    {type}
                  </span>
                </div>
              ))}
            </div>

            <p className="border-t pt-3 text-xs italic text-muted-foreground">
              &ldquo;Hybrid sessions start this week. They are unpleasant. That&apos;s the work.&rdquo; — Coach
            </p>
          </div>

        </div>
      </div>
      <HowItWorks />
      <SamplePlan />
      <Faq />
      <FinalCta />
      <Footer />
    </main>
  );
}
