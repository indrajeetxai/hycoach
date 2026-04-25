function Badge({ color, number }: { color: string; number: number }) {
  return (
    <div
      className="flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
      style={{ backgroundColor: color }}
    >
      {number}
    </div>
  );
}

export function HowItWorks() {
  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-16">
      <div className="mb-6 flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          How it works
        </p>
        <h2 style={{ fontSize: "17px", fontWeight: 500 }}>
          Four steps. The last one never stops.
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">

        {/* Block 1 — You tell Coach */}
        <div className="flex flex-col gap-3 rounded-lg border bg-background p-[18px]">
          <div className="flex items-center gap-2.5">
            <Badge color="#888780" number={1} />
            <span className="text-sm font-medium">You tell Coach</span>
          </div>
          <p className="text-[13px] leading-[1.55] text-muted-foreground">
            Race date. Current fitness. Goal.
          </p>
          <div className="mt-auto rounded-md bg-secondary p-2.5">
            <p className="mb-2 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
              Onboarding
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                ["Race", "Mar 15"],
                ["Goal", "Sub-1:30"],
                ["Days", "4 / wk"],
                ["5K", "26:00"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded border border-border bg-background px-2 py-1.5"
                >
                  <p className="text-[9px] text-muted-foreground">{label}</p>
                  <p className="text-[11px] font-medium">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Block 2 — Coach checks the math */}
        <div className="flex flex-col gap-3 rounded-lg border bg-background p-[18px]">
          <div className="flex items-center gap-2.5">
            <Badge color="#BA7517" number={2} />
            <span className="text-sm font-medium">Coach checks the math</span>
          </div>
          <p className="text-[13px] leading-[1.55] text-muted-foreground">
            If your goal doesn&apos;t fit the time, we say so.
          </p>
          <div className="mt-auto border-l-2 border-amber-500 bg-amber-50 px-3 py-2.5 dark:bg-amber-950/20">
            <p className="mb-1 text-[9px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-500">
              Reality check
            </p>
            <p className="text-[12px] leading-snug text-amber-700 dark:text-amber-400">
              Sub-90 in 8 weeks at 3 days/week — the math doesn&apos;t add up.
            </p>
          </div>
        </div>

        {/* Block 3 — Plan with reasoning */}
        <div className="flex flex-col gap-3 rounded-lg border bg-background p-[18px]">
          <div className="flex items-center gap-2.5">
            <Badge color="#185FA5" number={3} />
            <span className="text-sm font-medium">Plan with reasoning</span>
          </div>
          <p className="text-[13px] leading-[1.55] text-muted-foreground">
            Every week explains itself.
          </p>
          <div className="mt-auto border-l-2 border-blue-500 bg-blue-50 px-3 py-2.5 dark:bg-blue-950/20">
            <p className="mb-1 text-[9px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-500">
              Why this week
            </p>
            <p className="text-[12px] leading-snug text-blue-700 dark:text-blue-400">
              Building threshold capacity. Last week&apos;s pace ran easier than prescribed — pushing intensity up.
            </p>
          </div>
        </div>

        {/* Block 4 — It re-forms · weekly */}
        <div className="flex flex-col gap-3 rounded-lg border bg-background p-[18px]">
          <div className="flex items-center gap-2.5">
            <Badge color="#534AB7" number={4} />
            <span className="text-sm font-medium">It re-forms · weekly</span>
          </div>
          <p className="text-[13px] leading-[1.55] text-muted-foreground">
            Plan adapts to what actually happened.
          </p>
          <div className="mt-auto flex flex-col gap-1.5 rounded-md bg-[#534AB7] p-3 text-white">
            <p className="text-[9px] font-semibold uppercase tracking-wider opacity-85">
              Week 6
            </p>
            <div className="flex justify-between text-[12px]">
              <span className="opacity-70">Before</span>
              <span>5 sessions, 220 min</span>
            </div>
            <div className="my-0.5 border-t border-white/20" />
            <div className="flex justify-between text-[12px] font-medium">
              <span>After</span>
              <span>4 sessions, 195 min ↓</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
