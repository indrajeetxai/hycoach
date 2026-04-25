# Landing page integration — Case B (no reorder)

This file adds the full landing page + waitlist scope to your existing v0.5 checklist **without reordering** the A/B phases. Use this if you've already built A1-A4 and want to continue forward in the original order while expanding Phase B with the landing page work.

## How to use this

1. Save this file in your repo at `docs/landing-integration.md`
2. In your active Claude Code session, paste this single message:

```
Read docs/landing-integration.md and execute the prompt in the "Begin paste" section. Do not start any other work after.
```

3. Wait for the summary table
4. After it confirms, you can resume building with `/build-next`

---

## What this prompt does

- Adds a `waitlist` table to PRD §7
- Updates PRD §5 (Screens) and §10 (in/out scope) to reflect the expanded landing page
- Adds 7 new items to Phase B in CHECKLIST.md (renumbered B2 → B2-B8 with the original B3 shifting to B9): schema mutation, hero, "How it works" 4-block section, sample plan, FAQ, final CTA, footer + responsive verify
- Provides the final copy + design spec inline (so you don't need to keep the other landing files around)

---

## Begin paste (this is what Claude Code executes)

```
You are integrating the landing page + waitlist work into the existing v0.5 checklist for the HyCoach project. The user has already built A1-A4 and is continuing in the original order (no reorder).

## Step 1 — Read first

Read these files completely before any changes:
- docs/PRD.md §5 (Screens), §7 (Data model), §10 (in/out scope)
- docs/CHECKLIST.md Phase B (current B1, B2, B3)
- src/app/page.tsx if it exists (likely a Next.js placeholder)

## Step 2 — Update PRD §7 schema

In docs/PRD.md §7, add a new waitlist table at the end of the schema definitions (after raceResults). Use exactly:

waitlist: {
  email: string,
  source?: string,          // e.g., "landing_hero", "landing_footer" — for later analytics
  createdAt: number,
  // No user-account link; waitlist signups are anonymous.
  // Indexed by email for dedup on insert.
}

Add a new architectural note bullet near the schema (before §8): "waitlist is unauthenticated; the joinWaitlist mutation is callable pre-sign-in. Indexed by email for deduplication."

## Step 3 — Update PRD §0 changelog

Add to the v3.0 changelog section (or create a v3.1 entry): "Added landing page (5-section design) and waitlist table for lead capture in v0.5."

## Step 4 — Update PRD §5 Screens table

Change the "Landing" row's "Key components" cell to:
"Hero (tagline + Google sign-in + waitlist capture), 'How it works' 4-block section, sample plan overview, FAQ accordion, final CTA, minimal footer"

## Step 5 — Update PRD §10 (in/out scope)

In the "IN v1" first bullet, change "Landing, Google OAuth, ..." to:
"Landing page (hero + 'How it works' 4 blocks + sample plan + FAQ + CTA), waitlist email capture, Google OAuth signup/signin, full onboarding, ..."

## Step 6 — Expand Phase B in CHECKLIST.md

In docs/CHECKLIST.md, find Phase B. Currently it likely has:
- B1: schema
- B2: landing page (basic)
- B3: responsive verify

Replace B2 and B3 with the following 8 new items (B2 through B9). Keep B1 as-is, and add waitlist to its schema list:

Update B1 to include the waitlist table in its description. Find B1 and ensure its description mentions all tables: profiles, races, plans, weeks, workouts, exercises, workoutLogs, adjustments, raceResults, AND waitlist.

Then replace existing B2 and B3 with these 8 items (the new B9 takes the role of the old B3 responsive verify):

- [ ] **B2.** Build mutation convex/waitlist.ts:joinWaitlist({email, source?}): validates email format with Zod, dedupes via by_email index, inserts if new, returns {joined: boolean, alreadyOnList: boolean}. Mutation is unauthenticated (callable pre-sign-in). Add by_email index to the waitlist table in convex/schema.ts.

- [ ] **B3.** Build landing page hero section in src/app/page.tsx:
    - h1: "Your personal Hyrox coach." (32px desktop / 28px mobile, weight 500, letter-spacing -0.5px, line-height 1.1)
    - Subhead (15px, color text-secondary, line-height 1.6): "You set the race goal. Coach builds the plan — then keeps reshaping it every week, based on how training is actually going. Because real life is messy."
    - Primary CTA button: "Sign in with Google" with Google logo SVG. Wire to Convex Auth's signIn flow (you've completed A4, so this should work). After successful sign-in, route to /onboarding.
    - Secondary CTA: "Not ready yet? Join the waitlist →" — clicking reveals an inline email input + "Notify me" button. On submit, calls joinWaitlist mutation. Inline confirmation: "You're on the list. We'll be in touch." Handle alreadyOnList: true with: "You're already on the list."
    - Right-side visual on desktop (stacks below text on mobile <768px): a small card showing a stylized 7-day week grid. Header reads "Week 5 · Build" in small uppercase. Seven small day cells (Mon-Sun), each with day label and workout type label (Strength, Threshold, Rest, Hybrid, Easy run, Strength, Rest). The Hybrid day (Thursday) uses a purple background (c-purple class or equivalent) to draw the eye. Below the grid, italic small text: "Hybrid sessions start this week. They are unpleasant. That's the work." — Coach.
    - Layout: hero is a 2-column grid on desktop (1.2fr left text, 1fr right visual, 32px gap) inside a soft secondary-background container with border-radius-lg, 32px padding top/bottom, 16px padding sides. Stacks vertically on viewport <768px.
    - DO NOT include any eyebrow text above the h1.

- [ ] **B4.** Build "How it works" section as a 4-block visual layout. Section structure:
    - Section eyebrow (small uppercase text-tertiary): "How it works"
    - Section title (17px, weight 500): "Four steps. The last one never stops."
    - 22px margin below the title, then a 2×2 grid (single column on mobile <768px) with 12px gap.
    - All 4 blocks share the same skeleton: white card (background var(--color-background-primary), 0.5px border-tertiary, border-radius-lg, padding 18px). Each block is a flex column with gap 12px.
    - Each block contains, in order:
      1. Header row (flex, 10px gap): a 26px circular badge with white-text number on a colored fill + a 14px weight-500 heading
      2. A one-line description (13px, color text-secondary, line-height 1.55)
      3. A visual preview block at the bottom (margin-top: auto so all previews align at the bottom across equal-height cards)
    - Number badge colors (white text on colored fill):
      - Step 1: gray fill #888780
      - Step 2: amber fill #BA7517
      - Step 3: blue fill #185FA5
      - Step 4: purple fill #534AB7
    
    Block 1 — "You tell Coach":
    - Badge: 1 (gray)
    - Heading: "You tell Coach"
    - Description: "Race date. Current fitness. Goal."
    - Preview: secondary-background card, padding 10px, with small uppercase eyebrow "Onboarding" + a 2×2 grid of 4 small bordered cells: Race / Mar 15, Goal / Sub-1:30, Days / 4 / wk, 5K / 26:00
    
    Block 2 — "Coach checks the math":
    - Badge: 2 (amber)
    - Heading: "Coach checks the math"
    - Description: "If your goal doesn't fit the time, we say so."
    - Preview: warning-styled callout (background var(--color-background-warning), border-left 2px solid var(--color-text-warning), border-radius 0). Contents: small uppercase "Reality check" label + sample text in var(--color-text-warning): "Sub-90 in 8 weeks at 3 days/week — the math doesn't add up."
    
    Block 3 — "Plan with reasoning":
    - Badge: 3 (blue)
    - Heading: "Plan with reasoning"
    - Description: "Every week explains itself."
    - Preview: info-styled callout (background var(--color-background-info), border-left 2px solid var(--color-text-info), border-radius 0). Contents: small uppercase "Why this week" label + sample text in var(--color-text-info): "Building threshold capacity. Last week's pace ran easier than prescribed — pushing intensity up."
    
    Block 4 — "It re-forms · weekly":
    - Badge: 4 (purple)
    - Heading: "It re-forms · weekly"
    - Description: "Plan adapts to what actually happened."
    - Preview: purple-filled card (c-purple class), padding 10-12px, flex column with 6px gap. Contents:
      - Small uppercase "Week 6" label (opacity 0.85)
      - Row 1: "Before" (left, opacity 0.7) / "5 sessions, 220 min" (right)
      - Thin 1px horizontal divider (rgba(0,0,0,0.12))
      - Row 2: "After" (left, weight 500) / "4 sessions, 195 min ↓" (right, weight 500)
    
    Critical consistency rules:
    - All 4 cards are white-backgrounded (block 4 is NOT purple-backgrounded — only its badge and inner preview are purple)
    - All 4 descriptions are 4-10 words, single declarative line
    - All 4 preview blocks use margin-top: auto so they sit at the bottom

- [ ] **B5.** Build sample plan overview section: header "What your plan actually looks like.", subhead "One week from a 14-week sub-1:30 plan. Generated by Coach — not a template." Then a 7-day card grid (Mon-Sun). Each card has day name (uppercase, text-tertiary), workout type label, and a 1-line preview of exercises or pace:
    - Mon · Strength A · "RDL · Lunge · Squat"
    - Tue · Threshold · "4×6min @ 5:12/km"
    - Wed · Rest · (use background-tertiary, no preview line)
    - Thu · Hybrid · "30 wb + 400m × 3" (use c-purple class — purple-accented day)
    - Fri · Easy run · "50 min @ 6:00/km"
    - Sat · Strength B · "Press · Row · Carry"
    - Sun · Rest · (use background-tertiary)
    Below the grid: a Coach quote callout in a left-bordered box (border-left 2px solid var(--color-text-primary), background secondary, border-radius 0, padding 10px 14px). Inside: "Coach (Honest)" eyebrow label + "Hybrid sessions start this week. They are unpleasant. That's the work."

- [ ] **B6.** Build FAQ section: small uppercase eyebrow "Questions". Then a shadcn Accordion (default-collapsed) with 5 entries:
    1. "How is this different from a generic training plan?" — A: "Most plans are templates. HyCoach generates a plan for your race date, your fitness, your equipment, your time. And if you miss workouts or crush them, the plan adjusts each week."
    2. "I don't have a sled or wall ball. Can I still use this?" — A: "Yes. Your plan substitutes equivalent exercises and flags which stations you'll need to find before race day. No real gym has everything."
    3. "How much does it cost?" — A: "Free during early access. Pricing comes later, with plenty of notice for anyone using it."
    4. "I'm injured. Should I use this?" — A: "HyCoach asks about injuries during onboarding and adjusts your plan to work around them — but it's not a substitute for a physical therapist. If something hurts, see a professional first."
    5. "What if my race is in 3 weeks?" — A: "HyCoach handles short timelines, but it'll be honest with you about what's realistic. If 3 weeks isn't enough, we'll suggest training for the next race instead."
    Add the shadcn Accordion component if not already added (npx shadcn add accordion).

- [ ] **B7.** Build final CTA section: centered, "Ready when you are." header (18px, weight 500) + "Tell Coach about your race. Get your plan in 30 seconds." subhead (13px, text-secondary). Same two CTAs as the hero (primary "Sign in with Google" + secondary "Or join the waitlist →" link). The waitlist link should scroll back to the hero's waitlist form (or open the same inline form here — your call during build).

- [ ] **B8.** Build minimal footer: one centered line, 11px, text-tertiary: "HyCoach · Built for Hyrox athletes". No links.

- [ ] **B9.** Verify the entire landing page is responsive at 375px (iPhone SE viewport):
    - Hero stacks: text first, visual below
    - "How it works" 2×2 grid becomes single column
    - Sample plan 7-day grid scrolls horizontally OR stacks vertically (your call)
    - FAQ accordion taps work
    - All buttons meet 44px min tap target

## Step 7 — Confirm with summary

After all updates, give me this summary table:

| Step | File | Change | Status |
|---|---|---|---|
| 2 | docs/PRD.md §7 | Added waitlist table | [done/skipped/error] |
| 2 | docs/PRD.md schema notes | Added unauth note | [...] |
| 3 | docs/PRD.md §0 | Added changelog | [...] |
| 4 | docs/PRD.md §5 | Updated Landing row | [...] |
| 5 | docs/PRD.md §10 | Updated in-scope list | [...] |
| 6 | docs/CHECKLIST.md B1 | Added waitlist to schema list | [...] |
| 6 | docs/CHECKLIST.md Phase B | Replaced B2-B3 with B2-B9 (8 items) | [...] |

Then stop. Do not start any other work. Wait for me to say "continue" before resuming the build with /build-next.
```

## End paste
