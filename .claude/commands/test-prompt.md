---
description: Assemble and print a Claude API call's prompt for testing in the Anthropic Workbench
argument-hint: <call-name> (reality-check | plan-generation | weekly-recap | race-reflection)
---

Help me iterate on the `$ARGUMENTS` prompt by printing the assembled system prompt and a sample user message that I can paste into the Anthropic Workbench (or Claude.ai's API testing tools) to see real output.

**Process:**

1. Read these files and concatenate them per the composition rule in `prompts/prompt-composition.md`:
   - `prompts/hyrox-knowledge.md`
   - `prompts/coach-voice.md`
   - `prompts/personas/honest.md` (default; if I specify a different persona in my message, use that one)
   - `prompts/$ARGUMENTS.md`

2. Construct a realistic user message based on the call type. Use these defaults unless I specify otherwise:

   **For `reality-check`:**
   - Default scenario: 8 weeks until race, 3 days/week, 60 min/session, target sub-90, beginner with 26-min 5K. Available minutes = 1440. Required minimum = 3000. Deficit case.
   - Tell me you're using this scenario; I'll override if I want a different one.

   **For `plan-generation`:**
   - Default scenario: intermediate, 14 weeks, 4 days/week, 60 min/session, target sub-1:30, 5K pace 26:00, no past Hyrox, full equipment, no injuries, Honest persona.

   **For `weekly-recap`:**
   - Default scenario: end of week 4. 5/5 sessions logged, avg RPE 7, threshold run 15s under target. No adjustments. Strong-week path.

   **For `race-reflection`:**
   - Default scenario: goal sub-90, finish 1:28:42, 14 weeks, 56/60 workouts done, peak-week sled push at 4:12, race-day at 4:00. Hit-goal path, Honest persona.

3. Print BOTH the assembled system prompt AND the user message in chat, clearly separated, in code blocks I can copy.

4. After printing: ask me which scenario I want next (alternative scenarios per call):
   - `reality-check`: feasible-pass case OR continue-anyway case
   - `plan-generation`: short-plan case (4 weeks) OR no-equipment case OR injury case
   - `weekly-recap`: missed-week case OR sparse-logs case
   - `race-reflection`: missed-goal case OR DNF case

5. Suggest specific improvements to the prompt based on what you see, even before I run it. Look for: vague constraints, missing examples for the scenario, voice drift between persona and call instructions.

**Note:** If `convex/_prompts.ts` exists (i.e., the sync script has been run and we're past checklist D1), you can also offer to run the actual Convex action against the dev deployment — but only if I ask. Default to the print-to-chat workflow because it's faster and doesn't burn API tokens.
