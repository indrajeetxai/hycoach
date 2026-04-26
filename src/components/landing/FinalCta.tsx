"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GoogleIcon } from "@/components/landing/GoogleIcon";

type WaitlistStatus = "idle" | "loading" | "joined" | "exists" | "error";

export function FinalCta() {
  const router = useRouter();
  const { signIn } = useAuthActions();
  const { isAuthenticated } = useConvexAuth();
  const joinWaitlist = useMutation(api.waitlist.joinWaitlist);

  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<WaitlistStatus>("idle");

  async function handleNotify(e: { preventDefault(): void }) {
    e.preventDefault();
    setStatus("loading");
    try {
      const result = await joinWaitlist({ email, source: "landing_cta" });
      setStatus(result.joined ? "joined" : "exists");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-16">
      <div className="flex flex-col items-center gap-4 text-center">
        <h2 style={{ fontSize: "18px", fontWeight: 500 }}>
          Ready when you are.
        </h2>
        <p className="text-[13px] text-muted-foreground">
          Tell Coach about your race. Get your plan in 30 seconds.
        </p>

        {isAuthenticated ? (
          <Button size="lg" className="min-h-[44px]" onClick={() => router.push("/dashboard")}>
            Go to your plan →
          </Button>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Button
              size="lg"
              className="min-h-[44px] gap-2"
              onClick={() => void signIn("google", { redirectTo: "/onboarding" })}
            >
              <GoogleIcon />
              Sign in with Google
            </Button>

            {!showForm ? (
              <button
                onClick={() => setShowForm(true)}
                className="py-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Or join the waitlist →
              </button>
            ) : status === "joined" ? (
              <p className="text-sm text-green-600 dark:text-green-400">
                You&apos;re on the list. We&apos;ll be in touch.
              </p>
            ) : status === "exists" ? (
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
                  disabled={status === "loading"}
                >
                  {status === "loading" ? "…" : "Notify me"}
                </Button>
              </form>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
