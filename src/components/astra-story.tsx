import { AnimatePresence, motion, useReducedMotion, useSpring } from "motion/react";
import { AlertTriangle, ArrowRight, Check, Copy, FileSpreadsheet, MessageCircleQuestion, Phone, Play, RotateCcw, Sparkles, Upload, X } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DemoTag = () => <span className="rounded-full border border-warning/40 bg-warning/10 px-2.5 py-1 text-[10px] font-semibold tracking-wider text-current">ILLUSTRATIVE DEMO Â· DEMO DATA</span>;

/* ================= Campaign simulator ================= */

const stages = ["Upload", "Map", "Validate", "Choose employee", "Run campaign", "Outcomes"];
const outcomes = [
  { key: "Answered", n: 742, tone: "bg-voice" },
  { key: "Qualified", n: 186, tone: "bg-chat" },
  { key: "Callback", n: 121, tone: "bg-warning" },
  { key: "No answer", n: 456, tone: "bg-muted-foreground" },
  { key: "Not interested", n: 435, tone: "bg-destructive" },
];
const records: Record<string, { name: string; dur: string; lines: [string, string][] }> = {
  Answered: { name: "Kavya Rao", dur: "1m 58s", lines: [["Interest", "Wants brochure"], ["Next action", "Send details on WhatsApp"]] },
  Qualified: { name: "Arjun Mehta", dur: "2m 42s", lines: [["Budget", "â‚¹80Lâ€“â‚¹1Cr"], ["Location", "Hyderabad"], ["Next action", "Site visit follow-up"]] },
  Callback: { name: "Imran Khan", dur: "0m 51s", lines: [["Requested", "Call back Friday, 6 pm"], ["Next action", "Scheduled retry"]] },
  "No answer": { name: "Neha Iyer", dur: "â€”", lines: [["Attempts", "3 of 3"], ["Next action", "WhatsApp nudge"]] },
  "Not interested": { name: "Rohit Das", dur: "0m 34s", lines: [["Reason", "Already purchased"], ["Next action", "Close, do not call"]] },
};
const columns = [["Name", "Full name"], ["Phone", "Mobile"], ["City", "Location"], ["Source", "Lead source"]];

export function CampaignSimulator() {
  const [stage, setStage] = useState(0);
  const [called, setCalled] = useState(0);
  const [open, setOpen] = useState<string | null>(null);
  const reduce = useReducedMotion();
  const barRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<{ cancel: () => void }[]>([]);

  useEffect(() => {
    if (stage !== 4) return;
    if (reduce) { setCalled(1198); return; }
    let disposed = false;
    void import("animejs").then(({ animate }) => {
      if (disposed) return;
      const state = { v: 0 };
      const animations = [animate(state,{v:1198,duration:2600,ease:"inOut(2)",onUpdate:()=>setCalled(Math.round(state.v)),onComplete:()=>setStage(5)})];
      if (barRef.current) animations.push(animate(barRef.current,{scaleX:[0,1],duration:2600,ease:"inOut(2)"}));
      animationRef.current = animations;
    });
    return () => { disposed = true; animationRef.current.forEach((animation)=>animation.cancel()); animationRef.current=[]; };
  }, [stage, reduce]);

  const next = () => setStage((s) => Math.min(5, s + 1));
  const reset = () => { setStage(0); setCalled(0); setOpen(null); };
  const total = outcomes.reduce((a, o) => a + (o.key === "Answered" || o.key === "No answer" ? o.n : 0), 0);

  return <section className="border-y border-border bg-surface py-20" data-guide="Upload a spreadsheet and Astra Voice gives every row an outcome." data-guide-tone="voice">
    <div className="mx-auto max-w-[1200px] px-5 lg:px-8">
      <div className="flex flex-wrap items-center gap-3"><p className="eyebrow text-voice">CAMPAIGNS FROM A SPREADSHEET</p><DemoTag/></div>
      <h2 className="mt-4 max-w-3xl text-balance text-4xl font-extrabold sm:text-5xl">Your list has names. Give each one a next step.</h2>
      <ol className="mt-8 grid grid-cols-3 gap-2 sm:grid-cols-6" aria-label="Campaign progress">{stages.map((s, i) => <li key={s}><button type="button" disabled={i > stage} onClick={() => setStage(i)} aria-current={i === stage ? "step" : undefined} className={cn("w-full rounded-md border px-2 py-2 text-left text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50", i === stage ? "border-voice bg-voice-soft font-semibold" : i < stage ? "border-voice/30" : "border-border")}><span className="tabular-nums text-muted-foreground">0{i + 1}</span><span className="block truncate">{s}</span></button></li>)}</ol>

      <div className="mt-5 min-h-[360px] rounded-lg border border-border bg-card p-5 shadow-panel sm:p-7">
        <AnimatePresence mode="wait"><motion.div key={stage} initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }} transition={{ duration: .2 }}>
          {stage === 0 && <div className="grid place-items-center rounded-lg border-2 border-dashed border-voice/40 bg-voice-soft p-10 text-center"><FileSpreadsheet className="size-10 text-voice"/><b className="mt-3">campaign-leads.xlsx</b><p className="text-sm text-muted-foreground">1,248 rows Â· 4 columns Â· sample file</p><Button className="mt-5 bg-voice hover:bg-voice/90" onClick={next}><Upload/> Use sample file</Button></div>}
          {stage === 1 && <div><h3 className="text-xl font-bold">Map your columns</h3><div className="mt-4 divide-y divide-border rounded-lg border border-border">{columns.map(([a, b]) => <div key={a} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-3 text-sm"><span className="font-mono text-xs">{b}</span><ArrowRight className="size-4 text-voice"/><span className="flex items-center gap-1.5 font-medium"><Check className="size-4 text-success"/>{a}</span></div>)}</div><Button className="mt-5 bg-voice hover:bg-voice/90" onClick={next}>Validate rows <ArrowRight/></Button></div>}
          {stage === 2 && <div><h3 className="text-xl font-bold">Validation</h3><div className="mt-4 grid gap-3 sm:grid-cols-3">{[["1,198", "Ready", Check, "text-success"], ["27", "Duplicates merged", Copy, "text-warning"], ["23", "Invalid numbers", AlertTriangle, "text-destructive"]].map(([n, l, I, c]) => { const Icon = I as typeof Check; return <div key={l as string} className="rounded-lg border border-border p-4"><Icon className={cn("size-5", c as string)}/><b className="mt-2 block text-3xl tabular-nums">{n as string}</b><span className="text-sm text-muted-foreground">{l as string}</span></div>; })}</div><Button className="mt-5 bg-voice hover:bg-voice/90" onClick={next}>Continue with 1,198 <ArrowRight/></Button></div>}
          {stage === 3 && <div><h3 className="text-xl font-bold">Who should call them?</h3><button type="button" onClick={next} className="mt-4 flex w-full items-center gap-4 rounded-lg border border-voice bg-voice-soft p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><span className="grid size-12 place-items-center rounded-full bg-voice/15 text-voice"><Sparkles/></span><span><b className="block">Maya</b><span className="text-sm text-muted-foreground">Lead qualification Â· Demo voice</span></span><span className="ml-auto flex items-center gap-1 text-sm font-medium text-voice"><Play className="size-4"/> Start campaign</span></button></div>}
          {stage === 4 && <div aria-live="polite"><h3 className="flex items-center gap-2 text-xl font-bold"><Phone className="size-5 text-voice"/> Maya is callingâ€¦</h3><p className="mt-4 text-5xl font-extrabold tabular-nums">{called.toLocaleString("en-IN")}<span className="text-xl font-medium text-muted-foreground"> / 1,198 simulated calls</span></p><div className="mt-5 h-2 overflow-hidden rounded-full bg-border"><div ref={barRef} className="h-full origin-left bg-voice" style={{ transform: reduce ? "scaleX(1)" : "scaleX(0)" }}/></div></div>}
          {stage === 5 && <div><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-xl font-bold">Outcome breakdown</h3><span className="text-xs text-muted-foreground">Answered includes qualified and callback Â· {total.toLocaleString("en-IN")} reached or attempted</span></div><div className="mt-4 grid gap-2 sm:grid-cols-5">{outcomes.map((o) => <button key={o.key} type="button" onClick={() => setOpen(o.key)} aria-pressed={open === o.key} className={cn("rounded-lg border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", open === o.key ? "border-foreground bg-secondary" : "border-border hover:bg-secondary")}><i className={cn("block size-2 rounded-full", o.tone)}/><b className="mt-2 block text-2xl tabular-nums">{o.n}</b><span className="text-sm">{o.key}</span><span className="mt-1 block text-[11px] text-muted-foreground">View a record</span></button>)}</div>
            <AnimatePresence>{open && records[open] && <motion.div initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4 rounded-lg border border-border p-4"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full bg-voice/10 text-sm font-semibold">{records[open]!.name.split(" ").map((w) => w[0]).join("")}</span><div><b>{records[open]!.name}</b><p className="text-xs text-muted-foreground">{open} Â· Call {records[open]!.dur}</p></div><button type="button" className="ml-auto rounded p-1 hover:bg-secondary" aria-label="Close record" onClick={() => setOpen(null)}><X className="size-4"/></button></div><dl className="mt-4 grid gap-2 sm:grid-cols-3">{records[open]!.lines.map(([k, v]) => <div key={k} className="rounded-md bg-surface p-3"><dt className="text-[11px] text-muted-foreground">{k}</dt><dd className="text-sm font-semibold">{v}</dd></div>)}</dl></motion.div>}</AnimatePresence>
            <Button variant="outline" className="mt-5" onClick={reset}><RotateCcw/> Run again</Button></div>}
        </motion.div></AnimatePresence>
      </div>
    </div>
  </section>;
}

/* ================= Conversation â†’ structured data ================= */

const transcript: { who: "Maya" | "Arjun"; parts: (string | { hl: string; field: number })[] }[] = [
  { who: "Maya", parts: ["Hi Arjun, Maya from Astra. What kind of home are you looking for?"] },
  { who: "Arjun", parts: ["A ", { hl: "3 BHK", field: 0 }, ", ideally in ", { hl: "Hyderabad", field: 1 }, "."] },
  { who: "Maya", parts: ["Great. Do you have a budget in mind?"] },
  { who: "Arjun", parts: ["Somewhere ", { hl: "around 80 lakh", field: 2 }, ", maybe up to a crore."] },
  { who: "Maya", parts: ["And when are you hoping to move?"] },
  { who: "Arjun", parts: ["", { hl: "Within three months", field: 3 }, ". And ", { hl: "yes, I'd like a site visit", field: 4 }, "."] },
];
const fields = [["Requirement", "3 BHK"], ["Location", "Hyderabad"], ["Budget", "â‚¹80Lâ€“â‚¹1Cr"], ["Timeline", "Within 3 months"], ["Next action", "Sales follow-up Â· site visit"]];

export function ConversationToData() {
  const wrap = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const [lit, setLit] = useState(-1);
  const [paths, setPaths] = useState<string[]>([]);
  const reduce = useReducedMotion();
  const timers = useRef<number[]>([]);
  const animations = useRef<{ cancel: () => void }[]>([]);

  const measure = () => {
    const root = wrap.current; if (!root) return;
    const r = root.getBoundingClientRect();
    const out = fields.map((_, i) => {
      const a = root.querySelector(`[data-phrase="${i}"]`)?.getBoundingClientRect();
      const b = root.querySelector(`[data-field="${i}"]`)?.getBoundingClientRect();
      if (!a || !b || b.left < a.right) return "";
      const x1 = a.right - r.left, y1 = a.top + a.height / 2 - r.top, x2 = b.left - r.left, y2 = b.top + b.height / 2 - r.top, mx = (x1 + x2) / 2;
      return `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
    });
    setPaths(out);
  };
  useLayoutEffect(() => { const root=wrap.current; const observer=root ? new ResizeObserver(measure) : null; if(root) observer?.observe(root); document.fonts?.ready.then(measure); measure(); window.addEventListener("resize", measure); return () => { observer?.disconnect(); window.removeEventListener("resize", measure); timers.current.forEach(clearTimeout); animations.current.forEach((animation)=>animation.cancel()); }; }, []);

  const play = () => {
    timers.current.forEach(clearTimeout); timers.current=[];
    animations.current.forEach((animation)=>animation.cancel()); animations.current=[];
    measure();
    if (reduce) { setLit(4); return; }
    setLit(-1);
    fields.forEach((_, i) => timers.current.push(window.setTimeout(async () => {
      setLit(i);
      const p = svg.current?.querySelector<SVGPathElement>(`[data-path="${i}"]`);
      if (p) { const len = p.getTotalLength(); p.style.strokeDasharray = `${len}`; const { animate }=await import("animejs"); animations.current.push(animate(p,{strokeDashoffset:[len,0],duration:700,ease:"inOut(3)"})); }
    }, 350 + i * 800)));
  };

  return <section className="bg-guide py-20 text-guide-foreground" data-guide="Astra Voice listens for the facts that matter and files them for your team." data-guide-tone="voice">
    <div className="mx-auto max-w-[1200px] px-5 lg:px-8">
      <div className="flex flex-wrap items-center gap-3"><p className="eyebrow text-voice">AFTER THE CALL</p><DemoTag/></div>
      <h2 className="mt-4 max-w-3xl text-balance text-4xl font-extrabold sm:text-5xl">The conversation is over. The work isnâ€™t.</h2>
      <div ref={wrap} className="relative mt-10 grid gap-8 lg:grid-cols-[1.1fr_.9fr] lg:gap-24">
        <svg ref={svg} className="pointer-events-none absolute inset-0 hidden size-full lg:block" aria-hidden="true">{paths.map((d, i) => d && <path key={i} data-path={i} d={d} fill="none" strokeWidth="1.5" className={cn("transition-opacity", i <= lit ? "opacity-100" : "opacity-0", i === 4 ? "stroke-chat" : "stroke-voice")}/>)}</svg>
        <div className="space-y-3 rounded-lg border border-guide-border p-5" aria-label="Call transcript">
          <p className="flex items-center gap-2 text-xs text-guide-muted"><Phone className="size-4 text-voice"/> Maya â†” Arjun Mehta Â· 2m 42s</p>
          {transcript.map((line, i) => <p key={i} className={cn("rounded-md px-3 py-2 text-sm leading-relaxed", line.who === "Maya" ? "bg-guide-border/50" : "")}><b className="mr-2 text-xs text-guide-muted">{line.who}</b>{line.parts.map((p, j) => typeof p === "string" ? <span key={j}>{p}</span> : <mark key={j} data-phrase={p.field} className={cn("rounded px-1 transition-colors duration-500", p.field <= lit ? (p.field === 4 ? "bg-chat/25 text-guide-foreground" : "bg-voice/30 text-guide-foreground") : "bg-transparent text-guide-foreground")}>{p.hl}</mark>)}</p>)}
        </div>
        <div className="self-center rounded-lg border border-guide-border p-5">
          <p className="text-xs text-guide-muted">Lead record Â· written automatically</p>
          <dl className="mt-3 divide-y divide-guide-border">{fields.map(([k, v], i) => <div key={k} data-field={i} className="grid grid-cols-[110px_1fr] items-center gap-3 py-3"><dt className="text-sm text-guide-muted">{k}</dt><dd className={cn("text-sm font-semibold transition-all duration-500", i <= lit ? "opacity-100" : "opacity-20")}>{i <= lit ? v : "?"}</dd></div>)}</dl>
          <span className={cn("mt-3 inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs transition-opacity", lit >= 4 ? "bg-chat/15 text-chat opacity-100" : "opacity-0")}><Check className="size-3.5"/> Qualified Â· 91% confidence</span>
        </div>
      </div>
      <Button onClick={play} variant="outline" className="mt-8 border-guide-border bg-transparent text-guide-foreground hover:bg-guide-border hover:text-guide-foreground"><Play/> {lit >= 0 ? "Replay extraction" : "Play the call"}</Button>
    </div>
  </section>;
}


export { CursorGuide } from "@/components/astra-guide";
