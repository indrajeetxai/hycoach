import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const QUESTIONS = [
  {
    q: "How is this different from a generic training plan?",
    a: "Most plans are templates. HyCoach generates a plan for your race date, your fitness, your equipment, your time. And if you miss workouts or crush them, the plan adjusts each week.",
  },
  {
    q: "I don't have a sled or wall ball. Can I still use this?",
    a: "Yes. Your plan substitutes equivalent exercises and flags which stations you'll need to find before race day. No real gym has everything.",
  },
  {
    q: "How much does it cost?",
    a: "Free during early access. Pricing comes later, with plenty of notice for anyone using it.",
  },
  {
    q: "I'm injured. Should I use this?",
    a: "HyCoach is not a substitute for a physical therapist. If something hurts, see a professional first — don't follow any training plan, including this one, without clearance.",
  },
  {
    q: "What if my race is in 3 weeks?",
    a: "HyCoach handles short timelines, but it'll be honest with you about what's realistic. If 3 weeks isn't enough, we'll suggest training for the next race instead.",
  },
] as const;

export function Faq() {
  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-16">
      <p className="mb-6 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Questions
      </p>
      <Accordion multiple={false} className="w-full">
        {QUESTIONS.map(({ q, a }, i) => (
          <AccordionItem key={i} value={`item-${i}`}>
            <AccordionTrigger className="min-h-[44px] text-left text-[14px] font-medium">
              {q}
            </AccordionTrigger>
            <AccordionContent className="text-[13px] leading-relaxed text-muted-foreground">
              {a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
