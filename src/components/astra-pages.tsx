import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowRight, CalendarCheck, Check, ClipboardList, Code2, Database, FileLock2, Fingerprint, Headphones,
  KeyRound, LifeBuoy, Lock, MessageCircle, Phone, ScrollText, ServerCog, ShieldCheck, Target, TrendingUp, Users, Webhook,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { DemoDialog } from "@/components/astra-site";
import { submitDemoRequest } from "@/lib/demo-requests.functions";
import { SolutionStory } from "@/components/astra-solution-story";

export function PageIntro({ eyebrow, title, lead, accent = "text-voice", children }: { eyebrow: string; title: ReactNode; lead: string; accent?: string; children?: ReactNode }) {
  return <section className="site-container pb-12 pt-16 sm:pt-20"><motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}><p className={cn("eyebrow", accent)}>{eyebrow}</p><h1 className="page-title mt-4 max-w-5xl text-balance">{title}</h1><p className="mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">{lead}</p>{children}</motion.div></section>;
}

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("site-container", className)}>{children}</div>;
}

export function CtaBand() {
  return <section className="bg-guide py-16 text-guide-foreground" data-guide="Tell us what you want to improve. We'll ask only what's relevant." data-guide-tone="both"><Container className="grid items-center gap-6 md:grid-cols-[1fr_auto]"><div><h2 className="text-balance text-3xl font-bold sm:text-4xl">See it with your own conversations.</h2><p className="mt-2 text-guide-muted">A focused walkthrough, configured around how your team calls and messages customers.</p></div><Button asChild size="lg" className="bg-voice hover:bg-voice/90"><Link to="/book-demo">Book a demo <ArrowRight/></Link></Button></Container></section>;
}

/* ---------- Solutions ---------- */

export const solutions = [
  { slug: "lead-qualification", Icon: Target, title: "Lead qualification", short: "Every new enquiry asked the right questions within minutes.",
    lead: "Astra Voice can call new leads, ask your qualification questions, and return structured answers for your sales team.",
    voice: ["Calls new enquiries through a configured workflow", "Asks your budget, timeline and team-size questions", "Scores and tags each lead"],
    chat: ["Sends a follow-up on WhatsApp after the call", "Keeps the answers on the contact record", "Moves qualified leads into the pipeline"] },
  { slug: "sales-follow-up", Icon: TrendingUp, title: "Sales follow-up", short: "Follow-ups that never slip, across calls and chats.",
    lead: "Give each salesperson one view of every customer conversation, with reminders and next steps that keep deals moving.",
    voice: ["Reminder and re-engagement calls", "Call summaries written for the rep", "Books meetings into rep calendars"],
    chat: ["Shared WhatsApp inbox with owners", "Deal stages beside every chat", "Quick replies and templates"] },
  { slug: "customer-support", Icon: LifeBuoy, title: "Customer support", short: "Answer common questions instantly, hand off the rest.",
    lead: "Handle routine questions on the phone and on WhatsApp, and hand anything complex to a person with the full history attached.",
    voice: ["Answers FAQs from your knowledge base", "Routes urgent calls to the right team", "Works outside office hours"],
    chat: ["Assign conversations to teammates", "Internal notes and tags", "Response-time tracking"] },
  { slug: "appointments", Icon: CalendarCheck, title: "Appointments", short: "Bookings, confirmations and reminders handled for you.",
    lead: "Let customers book, confirm or reschedule by phone or WhatsApp through a configured calendar connection.",
    voice: ["Books into available calendar slots", "Confirmation and reminder calls", "Reschedules without staff involvement"],
    chat: ["WhatsApp reminders before each visit", "One-tap confirm or reschedule", "No-show follow-ups"] },
  { slug: "customer-engagement", Icon: Users, title: "Customer engagement", short: "Stay in touch at the right moments, without spamming.",
    lead: "Run approved WhatsApp broadcasts and outbound call campaigns that are personalised and respect opt-outs.",
    voice: ["Outbound campaigns from a spreadsheet", "Feedback and renewal calls", "Outcome reports per campaign"],
    chat: ["Scheduled, approved broadcasts", "Audience segments by tag or stage", "Opt-out handling built in"] },
] as const;

export type Solution = (typeof solutions)[number];

export function SolutionGrid() {
  const featured = solutions[0]!;
  const rest = solutions.slice(1);
  return (
    <div className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
      <Link
        to="/solutions/$slug"
        params={{ slug: featured.slug }}
        className="group relative overflow-hidden rounded-lg border border-voice/30 bg-voice-soft p-6 shadow-panel transition-shadow hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-8"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="eyebrow text-voice">FEATURED · VOICE FIRST</span>
          <span className="rounded-full border border-voice/30 bg-card px-2 py-0.5 text-[10px] font-semibold text-voice">ILLUSTRATIVE DEMO</span>
        </div>
        <h3 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">{featured.title}</h3>
        <p className="mt-3 max-w-xl text-pretty text-muted-foreground">{featured.short}</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
          <div className="rounded-md border border-voice/25 bg-card p-3">
            <p className="eyebrow text-voice">ASTRA VOICE</p>
            <p className="mt-2 text-sm font-semibold">Maya calls the enquiry</p>
            <p className="mt-1 text-xs text-muted-foreground">Budget · timeline · team size</p>
          </div>
          <ArrowRight className="mx-auto size-4 rotate-90 text-voice sm:rotate-0" />
          <div className="rounded-md border border-border bg-card p-3">
            <p className="eyebrow text-muted-foreground">STRUCTURED OUTCOME</p>
            <ul className="mt-2 space-y-1 text-xs font-medium">
              <li>Interest · Product demo</li>
              <li>Status · Qualified</li>
              <li>Next · WhatsApp follow-up</li>
            </ul>
          </div>
        </div>
        <span className="mt-6 inline-flex items-center gap-1 text-sm font-semibold">Explore lead qualification <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></span>
      </Link>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        {rest.map(({ slug, Icon, title, short }) => {
          const tone = slug === "customer-engagement" ? "chat" : "both";
          return (
            <Link
              key={slug}
              to="/solutions/$slug"
              params={{ slug }}
              className={cn(
                "group flex min-h-[7.5rem] flex-col rounded-lg border bg-card p-5 transition-shadow hover:shadow-panel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                tone === "chat" ? "border-chat/35" : "border-border",
              )}
            >
              <div className="flex items-start gap-3">
                <Icon className={cn("size-5 shrink-0", tone === "chat" ? "text-chat-dark" : "text-voice")} />
                <div className="min-w-0">
                  <span className={cn("eyebrow", tone === "chat" ? "text-chat-dark" : "text-muted-foreground")}>
                    {tone === "chat" ? "CHAT LED" : "VOICE + CHAT"}
                  </span>
                  <h3 className="mt-1 text-lg font-bold">{title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{short}</p>
                </div>
              </div>
              <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-medium">Explore <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}


export function SolutionDetail({ s }: { s: Solution }) {
  return <>
    <PageIntro eyebrow={`SOLUTIONS / ${s.title.toUpperCase()}`} title={s.title} lead={s.lead}><div className="mt-7 flex flex-wrap gap-3"><Button asChild size="lg"><Link to="/book-demo">Book a demo <ArrowRight/></Link></Button><Button asChild size="lg" variant="outline"><Link to="/solutions">All solutions</Link></Button></div></PageIntro>
    <SolutionStory solution={s}/>
  </>;
}

/* ---------- Integrations ---------- */

export const integrationGroups = [
  { Icon: Database, title: "CRM", items: ["Contacts", "Deal stages", "Call outcomes"], note: "A configured connection can keep customer records and outcomes in sync." },
  { Icon: Users, title: "Lead sources", items: ["Website forms", "Spreadsheets", "Existing systems"], note: "Bring new enquiries into one controlled workflow." },
  { Icon: Webhook, title: "Webhooks", items: ["Call completed", "Lead qualified", "Message received"], note: "Configured events can notify your existing systems." },
  { Icon: Code2, title: "APIs", items: ["Contacts", "Campaign jobs", "Results"], note: "Connect supported workflows after technical review." },
  { Icon: ServerCog, title: "Business systems", items: ["Calendars", "Phone routing", "Internal tools"], note: "Scope the right connection around your operating process." },
];

/* ---------- Pricing ---------- */

export function PricingTabs() {
  const plans = [
    {
      id: "voice",
      name: "Astra Voice",
      tone: "text-voice",
      border: "border-voice/35",
      check: "text-voice",
      badge: null as string | null,
      basis: "AI employees, calling usage and required configuration determine the quote.",
      label: "Request Voice quote",
      points: ["AI employees", "Inbound and outbound workflows", "Business knowledge", "Campaigns", "Conversation results", "Recordings and transcripts where available", "Configured integrations"],
    },
    {
      id: "chat",
      name: "Astra Chat",
      tone: "text-chat-dark",
      border: "border-chat/35",
      check: "text-chat-dark",
      badge: null,
      basis: "Team size, WhatsApp setup and required workflow automation determine the quote.",
      label: "Request Chat quote",
      points: ["Team inbox", "Contacts", "Pipeline", "Notes and tags", "Templates", "Broadcast tools", "Automation", "Analytics"],
    },
    {
      id: "both",
      name: "Connected setup",
      tone: "text-foreground",
      border: "border-foreground/25",
      check: "text-foreground",
      badge: "Recommended when journeys need both",
      basis: "Astra Voice and Astra Chat configured together around the customer journey you choose.",
      label: "Discuss connected setup",
      points: ["Astra Voice", "Astra Chat", "Configured shared customer journey", "Conversation continuity", "Scoped implementation"],
    },
  ] as const;

  const card = (plan: (typeof plans)[number], featured = false) => (
    <div className={cn("flex h-full flex-col rounded-lg border bg-card p-6 shadow-panel", plan.border, featured && "ring-2 ring-foreground/15 bg-secondary/40")}>
      {plan.badge ? <span className="mb-3 inline-flex w-fit rounded-full bg-secondary px-2.5 py-1 text-[10px] font-semibold tracking-wide">{plan.badge}</span> : <span className="mb-3 inline-flex h-6" />}
      <p className="eyebrow text-muted-foreground">PRICING BASED ON</p>
      <h3 className={cn("mt-2 text-2xl font-extrabold", plan.tone)}>{plan.name}</h3>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{plan.basis}</p>
      <ul className="mt-5 space-y-2">
        {plan.points.slice(0, 5).map((pt) => (
          <li key={pt} className="flex gap-2 text-sm"><Check className={cn("mt-0.5 size-4 shrink-0", plan.check)} />{pt}</li>
        ))}
        {plan.points.length > 5 && <li className="text-xs text-muted-foreground">+ {plan.points.length - 5} more where configured</li>}
      </ul>
      <Button asChild className="mt-6 w-full"><Link to="/book-demo">{plan.label} <ArrowRight /></Link></Button>
    </div>
  );

  return (
    <>
      <div className="hidden gap-4 lg:grid lg:grid-cols-3">{plans.map((plan) => <div key={plan.id}>{card(plan, plan.id === "both")}</div>)}</div>
      <div className="lg:hidden">
        <Tabs defaultValue="both" className="w-full">
          <TabsList className="h-auto w-full flex-wrap justify-start">
            <TabsTrigger value="voice">Astra Voice</TabsTrigger>
            <TabsTrigger value="chat">Astra Chat</TabsTrigger>
            <TabsTrigger value="both">Connected</TabsTrigger>
          </TabsList>
          {plans.map((plan) => (
            <TabsContent key={plan.id} value={plan.id} className="mt-6">{card(plan, plan.id === "both")}</TabsContent>
          ))}
        </Tabs>
      </div>
      <div className="mt-16">
        <p className="eyebrow">HOW PRICING WORKS</p>
        <ol className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          {[
            ["01", "Choose product", "Voice, Chat, or connected setup"],
            ["02", "Tell us volume", "Calls, conversations, team size"],
            ["03", "Confirm configuration", "Integrations and workflows"],
            ["04", "Receive quote", "Scoped to what you will use"],
          ].map(([n, title, body]) => (
            <li key={title} className="rounded-lg border border-border bg-card p-5">
              <span className="text-sm font-bold text-muted-foreground">{n}</span>
              <b className="mt-4 block">{title}</b>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </li>
          ))}
        </ol>
        <p className="mt-4 max-w-2xl text-sm text-muted-foreground">No public list prices — every quote reflects your volumes and required configuration.</p>
      </div>
    </>
  );
}


/* ---------- Security ---------- */

export const securityPoints = [
  { Icon: Lock, title: "Data boundaries", body: "Conversation data is handled within defined product and workspace boundaries." },
  { Icon: ServerCog, title: "Separated environments", body: "Voice and Chat environments can be separated around operational requirements." },
  { Icon: Fingerprint, title: "Role-based access", body: "Access can be limited by role for administrators, managers and team members." },
  { Icon: ScrollText, title: "Auditability", body: "Important access and configuration events can be retained for review." },
  { Icon: KeyRound, title: "Credential protection", body: "Integration credentials are kept away from everyday product screens and user workflows." },
  { Icon: FileLock2, title: "Controlled exports", body: "Data export and deletion workflows are scoped during implementation." },
  { Icon: ShieldCheck, title: "Human approval", body: "Outbound workflows can require human approval before external communication." },
  { Icon: Headphones, title: "Controlled integrations", body: "Every external connection is configured with a defined purpose and access boundary." },
];

/* ---------- Book demo ---------- */

type Path = "voice" | "chat" | "both";
const paths: { id: Path; title: string; body: string; Icon: typeof Phone }[] = [
  { id: "voice", title: "Business calls", body: "Astra Voice", Icon: Phone },
  { id: "chat", title: "WhatsApp conversations", body: "Astra Chat", Icon: MessageCircle },
  { id: "both", title: "Both", body: "Connected setup", Icon: ClipboardList },
];

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="grid gap-1.5 text-sm font-medium">{label}{children}</label>;
}
const selectCls = "h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const commonFields = [["name","Full name","name"],["email","Work email","email"],["company","Company","organization"],["role","Role","organization-title"]] as const;

export function BookDemoForm() {
  const [path, setPath] = useState<Path>("voice");
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState<Record<string,string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const submitRequest = useServerFn(submitDemoRequest);
  const reduce = useReducedMotion();
  if (done) return <div className="rounded-lg border border-success/40 bg-card p-8 text-center" role="status"><Check className="mx-auto size-8 text-success"/><h2 className="mt-3 text-2xl font-bold">Thanks. We’ll contact you about your AstraConnect demo.</h2><Button variant="outline" className="mt-6" onClick={() => setDone(false)}>Submit another</Button></div>;
  const showVoice = path !== "chat";
  const showChat = path !== "voice";
  return <form noValidate className="rounded-lg border border-border bg-card p-6 shadow-panel sm:p-8" onSubmit={async(e) => { e.preventDefault(); const form=new FormData(e.currentTarget); const required=["name","email","company","role","phone","primaryGoal",...(showVoice?["callsPerMonth","callDirection"]:[]),...(showChat?["teamSize","whatsappConversationsPerMonth","currentWhatsappUsage"]:[])]; const next:Record<string,string>={}; for(const name of required){if(!String(form.get(name)??"").trim())next[name]="Required";} const email=String(form.get("email")??""); if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))next['email']="Enter a valid work email"; setErrors(next); setSubmitError(""); if(Object.keys(next).length) return; setSubmitting(true); try { await submitRequest({data:{interest:path,fullName:String(form.get("name")),workEmail:email,company:String(form.get("company")),role:String(form.get("role")),phone:String(form.get("phone")),callsPerMonth:String(form.get("callsPerMonth")??""),callDirection:String(form.get("callDirection")??""),teamSize:String(form.get("teamSize")??""),whatsappConversationsPerMonth:String(form.get("whatsappConversationsPerMonth")??""),currentWhatsappUsage:String(form.get("currentWhatsappUsage")??""),currentCrm:String(form.get("currentCrm")??""),primaryGoal:String(form.get("primaryGoal"))}}); setDone(true); } catch { setSubmitError("We couldn’t save your request. Please try again."); } finally { setSubmitting(false); } }}>
    <fieldset>
      <legend className="text-sm font-semibold">What do you want to improve?</legend>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {paths.map(({ id, title, body, Icon }) => {
          const active = path === id;
          const tone = id === "voice" ? "voice" : id === "chat" ? "chat" : "both";
          return (
            <button
              key={id}
              type="button"
              aria-pressed={active}
              onClick={() => setPath(id)}
              className={cn(
                "rounded-md border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active && tone === "voice" && "border-voice bg-voice-soft",
                active && tone === "chat" && "border-chat bg-chat-soft",
                active && tone === "both" && "border-foreground bg-secondary",
                !active && "border-border hover:bg-secondary",
              )}
            >
              <Icon className={cn("size-5", tone === "voice" ? "text-voice" : tone === "chat" ? "text-chat-dark" : "text-foreground")} />
              <b className="mt-2 block text-sm">{title}</b>
              <span className="text-xs text-muted-foreground">{body}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
    <p className="mt-4 rounded-md border border-border bg-surface px-3 py-2 text-xs text-muted-foreground">We'll only ask questions relevant to {path === "voice" ? "Astra Voice" : path === "chat" ? "Astra Chat" : "a connected Voice + Chat setup"}. Typical response within one business day.</p>
    <div className="mt-6 grid gap-4 sm:grid-cols-2">{commonFields.map(([name,label,auto])=><Field key={name} label={label}><Input name={name} maxLength={name==="email"?255:150} type={name==="email"?"email":"text"} autoComplete={auto} aria-invalid={Boolean(errors[name])} aria-describedby={errors[name]?`${name}-error`:undefined}/>{errors[name]&&<span id={`${name}-error`} role="alert" className="text-xs text-destructive">{errors[name]}</span>}</Field>)}<Field label="Phone"><Input name="phone" maxLength={40} type="tel" autoComplete="tel" aria-invalid={Boolean(errors['phone'])}/>{errors['phone']&&<span role="alert" className="text-xs text-destructive">{errors['phone']}</span>}</Field></div>
    <AnimatePresence initial={false}>
      {showVoice && <motion.div key="v" initial={reduce ? false : { opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden"><p className="mt-6 text-sm font-semibold text-voice">About your calls</p><div className="mt-3 grid gap-4 sm:grid-cols-2"><Field label="Calls per month"><select name="callsPerMonth" className={selectCls} defaultValue=""><option value="" disabled>Select volume</option><option>Under 1,000</option><option>1,000 – 10,000</option><option>10,000+</option></select></Field><Field label="Inbound / outbound"><select name="callDirection" className={selectCls} defaultValue=""><option value="" disabled>Select direction</option><option>Inbound</option><option>Outbound</option><option>Both</option></select></Field></div></motion.div>}
      {showChat && <motion.div key="c" initial={reduce ? false : { opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden"><p className="mt-6 text-sm font-semibold text-chat-dark">About WhatsApp</p><div className="mt-3 grid gap-4 sm:grid-cols-2"><Field label="Team size"><select name="teamSize" className={selectCls} defaultValue=""><option value="" disabled>Select team size</option><option>1 – 5</option><option>6 – 20</option><option>20+</option></select></Field><Field label="Conversations per month"><select name="whatsappConversationsPerMonth" className={selectCls} defaultValue=""><option value="" disabled>Select volume</option><option>Under 1,000</option><option>1,000 – 10,000</option><option>10,000+</option></select></Field><Field label="Current WhatsApp usage"><select name="currentWhatsappUsage" className={selectCls} defaultValue=""><option value="" disabled>Select setup</option><option>WhatsApp Business app</option><option>Configured platform</option><option>Not sure</option></select></Field></div></motion.div>}
    </AnimatePresence>
    <div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="Current CRM (optional)"><Input name="currentCrm" maxLength={100} placeholder="CRM or spreadsheet"/></Field><Field label="Primary goal"><Input name="primaryGoal" maxLength={500} aria-invalid={Boolean(errors['primaryGoal'])} placeholder="What should improve first?"/>{errors['primaryGoal']&&<span role="alert" className="text-xs text-destructive">{errors['primaryGoal']}</span>}</Field></div>
    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><Button disabled={submitting} className="h-11 w-full sm:w-auto">{submitting ? "Sending…" : "Request demo"} <ArrowRight/></Button><p className="text-xs text-muted-foreground">No spam. We'll use this to prepare your walkthrough.</p></div>{submitError&&<p role="alert" className="mt-3 text-sm text-destructive">{submitError}</p>}
  </form>;
}

export function LegalPage({ title, updated, sections }: { title: string; updated: string; sections: [string, string][] }) {
  return <Container className="max-w-3xl py-16"><p className="eyebrow text-muted-foreground">LEGAL</p><h1 className="mt-4 text-5xl font-extrabold">{title}</h1><p className="mt-3 text-sm text-muted-foreground">Last updated {updated} · Draft for review</p><div className="mt-10 space-y-8">{sections.map(([h, b]) => <section key={h}><h2 className="text-xl font-bold">{h}</h2><p className="mt-2 text-pretty leading-relaxed text-muted-foreground">{b}</p></section>)}</div></Container>;
}

export { DemoDialog };
