---
description: Run the pre-deploy checklist before pushing or deploying
---

Pre-deploy checklist. Run through this before declaring a release ready or pushing to production.

**Process:**

1. **Typecheck** — run `npm run typecheck` or `npx tsc --noEmit`. Must pass clean.
2. **Lint** — run `npm run lint`. Fix any errors. Warnings are okay if intentional.
3. **Convex** — run `npx convex dev` (in another terminal mentally) and confirm no schema errors or function errors.
4. **Env vars** — verify these are set:
   - `.env.local`: `NEXT_PUBLIC_CONVEX_URL`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`
   - Convex dashboard env: `ANTHROPIC_API_KEY`
5. **Manual test cases** — read `docs/PRD.md` §16 and confirm at least the Reality Check pass + push-back cases work in dev:
   - 4 weeks + 2 days/wk + sub-90 → push back ✓
   - 14 weeks + 4 days/wk + finish → green-light ✓
6. **No secrets in git** — run `git diff --cached` and visually scan for any API keys, tokens, or `.env` content.
7. **Mobile check** — open dev server in mobile viewport (375px). Confirm onboarding flow is usable.
8. **Build** — run `npm run build`. Must pass clean.

**Report:**

After running the checklist, give me a status table:

```
✓ Typecheck
✓ Lint
✓ Convex schema
✓ Env vars (local + Convex)
✓ Reality Check manual test
✓ No secrets in git
✓ Mobile viewport
✓ Build
```

If anything fails, stop and tell me what's wrong before suggesting we deploy.
