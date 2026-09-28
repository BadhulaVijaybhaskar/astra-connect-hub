import { ArrowRight, MessageCircle, Phone } from "lucide-react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import { useEffect, useState } from "react";

import { DemoDialog } from "@/components/astra-site";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type StoryState = "voice" | "chat" | "connected";
type FocusTarget = StoryState | "guide" | null;

const story = {
  voice: { text: "Voice ready" },
  chat: { text: "New WhatsApp enquiry" },
  connected: { text: "Voice + Chat connected" },
} as const;

function ProductSignal({
  product,
  active,
  onFocus,
  onBlur,
}: {
  product: "voice" | "chat";
  active: boolean;
  onFocus: () => void;
  onBlur: () => void;
}) {
  const voice = product === "voice";
  return (
    <motion.button
      type="button"
      onHoverStart={onFocus}
      onHoverEnd={onBlur}
      onFocus={onFocus}
      onBlur={onBlur}
      animate={{ y: active ? -4 : 0 }}
      transition={{ type: "spring", stiffness: 220, damping: 24 }}
      className={cn(
        "hero-signal absolute top-[8%] z-20 hidden w-[13rem] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:block",
        voice ? "left-[2%]" : "right-[2%]",
      )}
      aria-label={`${voice ? "Astra Voice" : "Astra Chat"}: ${voice ? "AI employees for business calls" : "WhatsApp CRM and customer engagement"}`}
    >
      <span className="flex items-center gap-2">
        <span className={cn("grid size-8 place-items-center rounded-full", voice ? "bg-voice/10 text-voice" : "bg-chat/10 text-chat-dark")}>
          {voice ? <Phone className="size-4" /> : <MessageCircle className="size-4" />}
        </span>
        <span className={cn("eyebrow", voice ? "text-voice" : "text-chat-dark")}>{voice ? "ASTRA VOICE" : "ASTRA CHAT"}</span>
      </span>
      <span className="mt-3 block text-xs text-muted-foreground">{voice ? "New enquiry" : "New WhatsApp enquiry"}</span>
      <strong className="mt-1 block text-base">{voice ? "Maya" : "Arjun Mehta"}</strong>
      <span className="mt-0.5 block text-xs text-muted-foreground">{voice ? "Lead qualification" : "Product enquiry"}</span>
      <span className="mt-3 flex items-center gap-2 text-xs font-semibold">
        <i className={cn("size-2 rounded-full", voice ? "bg-voice" : "bg-chat")} />
        {voice ? "Ready to call" : "New lead"}
      </span>
    </motion.button>
  );
}

function HeroEcosystem() {
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState<StoryState>("voice");
  const [focus, setFocus] = useState<FocusTarget>(null);
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const springX = useSpring(pointerX, { stiffness: 70, damping: 22 });
  const springY = useSpring(pointerY, { stiffness: 70, damping: 22 });
  const orbX = useTransform(springX, (value) => value * 0.55);
  const orbY = useTransform(springY, (value) => value * 0.55);
  const cardX = useTransform(springX, (value) => value * -0.35);
  const cardY = useTransform(springY, (value) => value * -0.25);

  useEffect(() => {
    if (reduceMotion || focus) return;
    const order: StoryState[] = ["voice", "chat", "connected"];
    const timer = window.setInterval(() => {
      setActive((current) => order[(order.indexOf(current) + 1) % order.length] ?? "voice");
    }, 5000);
    return () => window.clearInterval(timer);
  }, [focus, reduceMotion]);

  const current = focus === "voice" || focus === "chat" || focus === "connected" ? focus : active;
  const voiceActive = current === "voice" || current === "connected" || focus === "guide";
  const chatActive = current === "chat" || current === "connected" || focus === "guide";

  return (
    <motion.div
      className="hero-ecosystem relative min-h-[320px] w-full overflow-x-clip sm:min-h-[610px] xl:min-h-[640px]"
      onPointerMove={(event) => {
        if (reduceMotion || event.pointerType === "touch") return;
        const rect = event.currentTarget.getBoundingClientRect();
        pointerX.set(((event.clientX - rect.left) / rect.width - 0.5) * 18);
        pointerY.set(((event.clientY - rect.top) / rect.height - 0.5) * 18);
      }}
      onPointerLeave={() => { pointerX.set(0); pointerY.set(0); }}
    >
      <div className="absolute inset-0 z-10 grid place-items-center" aria-hidden="true">
        <svg viewBox="0 0 700 620" className="h-full w-full overflow-visible">
          <ellipse cx="350" cy="325" rx="312" ry="164" className="fill-none stroke-border opacity-55" strokeWidth="1" transform="rotate(-7 350 325)" />
          <ellipse cx="350" cy="325" rx="242" ry="254" className="fill-none stroke-border opacity-40" strokeWidth="1" transform="rotate(36 350 325)" />
          <motion.ellipse cx="350" cy="325" rx="302" ry="142" className="fill-none stroke-voice" strokeWidth="1.5" transform="rotate(-14 350 325)" animate={{ opacity: voiceActive ? 1 : 0.5 }} transition={{ duration: 0.6 }} />
          <motion.ellipse cx="350" cy="325" rx="290" ry="158" className="fill-none stroke-chat-dark" strokeWidth="2" transform="rotate(27 350 325)" animate={{ opacity: chatActive ? 1 : 0.55 }} transition={{ duration: 0.6 }} />
          <motion.path d="M165 184 C184 230 232 266 292 301" className="hidden fill-none stroke-voice sm:block" strokeWidth="2" strokeLinecap="round" animate={{ pathLength: voiceActive ? 1 : 0.15, opacity: voiceActive ? 0.9 : 0.12 }} transition={{ duration: 0.8 }} />
          <motion.path d="M535 184 C516 230 468 266 408 301" className="hidden fill-none stroke-chat-dark sm:block" strokeWidth="2.25" strokeLinecap="round" animate={{ pathLength: chatActive ? 1 : 0.55, opacity: chatActive ? 1 : 0.5 }} transition={{ duration: 0.8 }} />
        </svg>
      </div>

      <motion.div style={reduceMotion ? {} : { x: cardX, y: cardY }} className="absolute inset-0 z-20">
        <ProductSignal product="voice" active={focus === "voice" || current === "voice"} onFocus={() => setFocus("voice")} onBlur={() => setFocus(null)} />
        <ProductSignal product="chat" active={focus === "chat" || current === "chat"} onFocus={() => setFocus("chat")} onBlur={() => setFocus(null)} />
      </motion.div>

      <div className="absolute inset-0 z-30 grid translate-y-3 place-items-center sm:translate-y-4">
        <motion.button
          type="button"
          style={reduceMotion ? {} : { x: orbX, y: orbY }}
          animate={{ scale: current === "connected" || focus === "guide" ? 1.025 : 1 }}
          onHoverStart={() => setFocus("guide")}
          onHoverEnd={() => setFocus(null)}
          onFocus={() => setFocus("guide")}
          onBlur={() => setFocus(null)}
           className="group relative grid size-32 place-items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:size-[11.5rem]"
          aria-label="Astra Guide: Iâ€™ll explain the product as you explore"
        >
          <span className="hero-orb absolute inset-0 rounded-full" />
          <motion.span className="absolute inset-0 rounded-full bg-voice/10" animate={{ opacity: focus === "voice" ? 0.34 : current === "voice" ? 0.16 : 0 }} />
          <motion.span className="absolute inset-0 rounded-full bg-chat/10" animate={{ opacity: focus === "chat" ? 0.34 : current === "chat" ? 0.16 : 0 }} />
          <span className="absolute inset-[18%] rounded-full border border-guide-border/65" />
        </motion.button>
      </div>

      <div className="pointer-events-none absolute inset-0 z-40 grid place-items-center" aria-hidden="true">
        <svg viewBox="0 0 700 620" className="h-full w-full overflow-visible">
          <motion.circle r="5" className="fill-voice" style={{ offsetPath: "path('M 48 325 A 302 142 0 1 0 652 325 A 302 142 0 1 0 48 325')", offsetRotate: "0deg" }} animate={reduceMotion ? { offsetDistance: "18%" } : { offsetDistance: ["0%", "100%"], opacity: voiceActive ? 1 : 0.3 }} transition={{ offsetDistance: { duration: 22, repeat: Infinity, ease: "linear" }, opacity: { duration: 0.6 } }} />
          <motion.circle r="5" className="fill-chat" style={{ offsetPath: "path('M 60 325 A 290 158 0 1 0 640 325 A 290 158 0 1 0 60 325')", offsetRotate: "0deg" }} animate={reduceMotion ? { offsetDistance: "68%" } : { offsetDistance: ["100%", "0%"], opacity: chatActive ? 1 : 0.65 }} transition={{ offsetDistance: { duration: 25, repeat: Infinity, ease: "linear" }, opacity: { duration: 0.6 } }} />
          {!reduceMotion && voiceActive && <motion.circle r="4" className="fill-voice" style={{ offsetPath: "path('M165 184 C184 230 232 266 292 301')", offsetRotate: "0deg" }} animate={{ offsetDistance: ["0%", "100%"], opacity: [0, 1, 0] }} transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 1.8, ease: "easeInOut" }} />}
          {!reduceMotion && chatActive && <motion.circle r="4" className="fill-chat" style={{ offsetPath: "path('M535 184 C516 230 468 266 408 301')", offsetRotate: "0deg" }} animate={{ offsetDistance: ["0%", "100%"], opacity: [0, 1, 0] }} transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 1.8, ease: "easeInOut" }} />}
        </svg>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-50 text-center sm:bottom-[1%]">
        <p className="eyebrow">ASTRA GUIDE</p>
        <p className="mt-1 text-sm text-muted-foreground">Your guide through AstraConnect</p>
        <div className="mx-auto mt-3 min-h-14 max-w-sm">
          <AnimatePresence mode="wait">
            <motion.div key={focus ?? current} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}>
              <p className="text-sm font-semibold">{focus === "guide" ? "Voice + Chat connected" : story[current].text}</p>
              {(current === "connected" || focus === "guide") && <p className="mt-1 text-xs text-muted-foreground">Use either independently. Connect both when needed.</p>}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="absolute inset-x-3 top-5 z-50 flex justify-between sm:hidden">
        <button type="button" onClick={() => setFocus(focus === "voice" ? null : "voice")} className="hero-chip text-voice"><Phone className="size-4" /> Astra Voice</button>
        <button type="button" onClick={() => setFocus(focus === "chat" ? null : "chat")} className="hero-chip text-chat-dark"><MessageCircle className="size-4" /> Astra Chat</button>
      </div>
    </motion.div>
  );
}

export function AstraHero() {
  const reduceMotion = useReducedMotion();
  return (
    <section className="hero-canvas relative overflow-x-clip overflow-y-hidden border-b border-border/60">
      <div className="mx-auto grid min-h-0 max-w-[1400px] items-center gap-4 px-5 py-5 sm:min-h-[720px] sm:gap-6 sm:py-6 lg:px-10 xl:min-h-[760px] xl:grid-cols-[1.06fr_.94fr] xl:px-12">
        <motion.div initial={reduceMotion ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 max-w-[780px] py-4 sm:py-8 lg:py-0 xl:-translate-y-3">
          <p className="eyebrow text-voice">ASTRACONNECT</p>
          <h1 className="mt-5 text-[2.2rem] font-extrabold leading-[.98] tracking-normal sm:text-[3.75rem] xl:text-[clamp(3.8rem,4.25vw,4.1rem)]">
            <span className="block xl:whitespace-nowrap">Your customers call.</span>
            <span className="block xl:whitespace-nowrap">Your customers message.</span>
            <span className="block font-medium xl:whitespace-nowrap">Be ready for both.</span>
          </h1>
          <p className="mt-7 max-w-2xl text-pretty text-base leading-relaxed text-foreground/70 sm:text-lg">AI employees for business calls. A dedicated CRM for WhatsApp.<br className="hidden sm:block" /> Choose either product. Connect both when you need to.</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="h-12 px-7 text-base"><a href="#products">Explore products <ArrowRight /></a></Button>
            <DemoDialog><Button variant="ghost" size="lg">Book a demo <ArrowRight /></Button></DemoDialog>
          </div>
        </motion.div>
        <HeroEcosystem />
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 mx-auto hidden max-w-[1400px] grid-cols-2 gap-12 px-12 sm:grid" aria-hidden="true">
        <div><span className="eyebrow text-voice">ASTRA VOICE</span><i className="mt-2 block h-px bg-voice/55" /></div>
        <div><span className="eyebrow text-chat-dark">ASTRA CHAT</span><i className="mt-2 block h-px bg-chat/55" /></div>
      </div>
    </section>
  );
}