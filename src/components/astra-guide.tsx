import { AnimatePresence, motion, useReducedMotion, useSpring } from "motion/react";
import { Link } from "@tanstack/react-router";
import { Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const faqs = [
  { q: "What is Astra Voice?", a: "AI employees that answer and make business calls, qualify leads, and book meetings. You set the job, instructions and knowledge." },
  { q: "What is Astra Chat?", a: "A dedicated WhatsApp CRM: a shared team inbox with contacts, tags, deal stages and follow-ups." },
  { q: "Do I need both?", a: "No. Each product works on its own. Connect them when you want one history across calls and chats." },
  { q: "Can people approve messages first?", a: "Yes. Campaigns and broadcasts can require approval before anything is sent." },
  { q: "How is it priced?", a: "Each product is quoted on your volumes. See the Pricing page or book a demo." },
];

/** Docked Guide — reacts to [data-guide] context without covering CTAs. */
export function CursorGuide() {
  const reduce = useReducedMotion();
  const [tip, setTip] = useState<{ title: string; text: string; action: string; tone: string } | null>(null);
  const [tone, setTone] = useState("both");
  const [open, setOpen] = useState(false);
  const [answer, setAnswer] = useState<number | null>(null);
  const [hoveringUi, setHoveringUi] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const lastEl = useRef<Element | null>(null);
  const frame = useRef<number | undefined>(undefined);
  const pulse = useSpring(1, { stiffness: 120, damping: 18 });

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (open || frame.current) return;
      const { target } = e;
      frame.current = window.requestAnimationFrame(() => {
        frame.current = undefined;
        const node = target as Element | null;
        const interactive = node?.closest?.("a,button,input,select,textarea,label,[role='button'],[role='tab']");
        setHoveringUi(Boolean(interactive && !interactive.closest?.("[data-guide-orb]")));
        const el = node?.closest?.("[data-guide]") ?? null;
        if (el !== lastEl.current) {
          lastEl.current = el;
          setTip(null);
          window.clearTimeout(timer.current);
          const t = el?.getAttribute("data-guide-tone") ?? "both";
          setTone(t);
          if (el && !interactive) {
            timer.current = window.setTimeout(() => {
              setTip({
                title: el.getAttribute("data-guide-title") ?? "Astra Guide",
                text: el.getAttribute("data-guide-description") ?? el.getAttribute("data-guide") ?? "",
                action: el.getAttribute("data-guide-action") ?? "Ask a question",
                tone: t,
              });
              if (!reduce) pulse.set(1.08);
              window.setTimeout(() => pulse.set(1), 220);
            }, 700);
          }
        }
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (frame.current) cancelAnimationFrame(frame.current);
      window.clearTimeout(timer.current);
    };
  }, [open, pulse, reduce]);

  const ring =
    tone === "voice"
      ? "border-voice shadow-[0_0_0_4px_color-mix(in_oklab,var(--voice)_18%,transparent)]"
      : tone === "chat"
        ? "border-chat shadow-[0_0_0_4px_color-mix(in_oklab,var(--chat)_18%,transparent)]"
        : "border-voice border-r-chat border-b-chat shadow-[0_0_0_4px_color-mix(in_oklab,var(--voice)_10%,transparent)]";

  const panel = (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-label="Ask AstraConnect"
          initial={reduce ? false : { opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12 }}
          className="fixed bottom-6 right-6 z-50 w-[min(360px,calc(100vw-2.5rem))] rounded-lg border border-guide-border bg-guide p-4 text-guide-foreground shadow-guide"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="size-4" />
            <b className="text-sm tracking-wide">ASK ASTRACONNECT</b>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setAnswer(null);
              }}
              aria-label="Close"
              className="ml-auto rounded p-1 hover:bg-guide-border"
            >
              <X className="size-4" />
            </button>
          </div>
          {answer === null ? (
            <div className="mt-3 grid gap-1.5">
              {faqs.map((f, i) => (
                <button
                  key={f.q}
                  type="button"
                  onClick={() => setAnswer(i)}
                  className="rounded-md border border-guide-border px-3 py-2 text-left text-sm hover:bg-guide-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {f.q}
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-3">
              <p className="text-sm font-semibold">{faqs[answer]!.q}</p>
              <p className="mt-2 text-sm text-guide-muted">{faqs[answer]!.a}</p>
              <div className="mt-4 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-guide-border bg-transparent text-guide-foreground hover:bg-guide-border hover:text-guide-foreground"
                  onClick={() => setAnswer(null)}
                >
                  Other questions
                </Button>
                <Button size="sm" asChild className="bg-voice hover:bg-voice/90">
                  <Link to="/book-demo">Book a demo</Link>
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (open) return panel;

  return (
    <>
      <div data-guide-orb className="pointer-events-none fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3 max-sm:bottom-5 max-sm:right-5">
        <AnimatePresence>
          {tip && !hoveringUi && (
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className="pointer-events-none w-[min(280px,calc(100vw-5rem))] rounded-md border border-guide-border bg-guide px-3 py-2 text-left text-xs leading-snug text-guide-foreground shadow-guide"
            >
              <b className="block">{tip.title}</b>
              <span className="mt-1 block text-guide-muted">{tip.text}</span>
              <span className="mt-2 block font-medium">{tip.action} →</span>
            </motion.div>
          )}
        </AnimatePresence>
        <motion.button
          type="button"
          aria-label="Open Astra Guide"
          data-guide-orb
          onClick={() => setOpen(true)}
          style={{ scale: pulse }}
          className="pointer-events-auto inline-flex items-center gap-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className={cn("grid size-11 place-items-center rounded-full border-2 bg-guide shadow-guide transition-colors", ring)}>
            <span className="size-2.5 rounded-full bg-gradient-to-r from-voice to-chat" />
          </span>
        </motion.button>
      </div>
</>
  );
}
