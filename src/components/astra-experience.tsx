import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowDown,
  ArrowRight,
  BarChart3,
  Bot,
  Check,
  FileSpreadsheet,
  MessageSquareText,
  Phone,
  PlugZap,
  Radio,
  Send,
  UsersRound,
  Workflow,
  AudioLines,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChatPreview, ProductLogo, VoicePreview, VoiceWorkspace } from "@/components/astra-site";
import { cn } from "@/lib/utils";

export function ProductSelector() {
  return <section id="products" className="mx-auto max-w-[1200px] px-5 pb-24 lg:px-8">
    <div className="mb-8 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end"><div><p className="eyebrow">TWO PRODUCTS · YOUR CHOICE</p><h2 className="mt-3 max-w-3xl text-balance text-4xl font-extrabold sm:text-5xl">Start with the conversation your customers already use.</h2></div><p className="max-w-sm text-sm text-muted-foreground">Astra Voice and Astra Chat work independently. Connect them only when your customer journey needs both.</p></div>
    <div className="grid gap-5 lg:grid-cols-2">
      <article className="min-w-0 transition-transform duration-300 hover:-translate-y-1" data-guide-title="AI Employee" data-guide-description="Give an AI employee a job, instructions and business knowledge." data-guide-action="Show me how" data-guide="Give an AI employee a job, instructions and business knowledge." data-guide-tone="voice"><VoicePreview compact/><Button asChild variant="ghost" className="mt-3"><Link to="/astra-voice">Explore Astra Voice <ArrowRight/></Link></Button></article>
      <article className="min-w-0 transition-transform duration-300 hover:-translate-y-1" data-guide-title="Team inbox" data-guide-description="Keep every WhatsApp conversation beside customer context and the sales pipeline." data-guide-action="Open the inbox" data-guide="Keep every WhatsApp conversation beside customer context and the sales pipeline." data-guide-tone="chat"><ChatPreview compact/><Button asChild variant="ghost" className="mt-3"><Link to="/astra-chat">Explore Astra Chat <ArrowRight/></Link></Button></article>
    </div>
  </section>;
}

export function VoiceStory() {
  return <section className="border-y border-border bg-background py-24" data-guide="Create Maya, teach the job, connect customers, then capture a structured outcome." data-guide-tone="voice">
    <div className="mx-auto max-w-[1200px] px-5 lg:px-8"><div className="mb-10 max-w-3xl"><ProductLogo product="voice"/><p className="eyebrow mt-6 text-voice">FROM CONVERSATION TO NEXT ACTION</p><h2 className="mt-4 text-balance text-4xl font-extrabold sm:text-6xl">Give the conversation a job.</h2><p className="mt-4 text-lg text-muted-foreground">Create an AI employee. Teach it your business. Put it to work.</p></div><VoiceWorkspace/></div>
  </section>;
}

export function CrmWorkflow() {
  const pathRef=useRef<SVGPathElement>(null); const signalRef=useRef<SVGCircleElement>(null); const animationRef=useRef<{cancel:()=>void}[]>([]); const [active,setActive]=useState(0); const reduced=useReducedMotion();
  useEffect(()=>{let cancelled=false;const run=async()=>{animationRef.current.forEach(a=>a.cancel());if(reduced){setActive(4);return;}setActive(0);const {animate}=await import("animejs");if(cancelled||!pathRef.current||!signalRef.current)return;const path=pathRef.current;const length=path.getTotalLength();path.style.strokeDasharray=`${length}`;path.style.strokeDashoffset=`${length}`;const progress={v:0};animationRef.current=[animate(path,{strokeDashoffset:[length,0],duration:6200,ease:"inOut(2)"}),animate(signalRef.current,{opacity:[0,1,1,0],duration:6200,ease:"linear"}),animate(progress,{v:[0,4.99],duration:6200,ease:"linear",onUpdate:()=>setActive(Math.min(4,Math.floor(progress.v)))})];};run();const timer=window.setInterval(run,7600);return()=>{cancelled=true;clearInterval(timer);animationRef.current.forEach(a=>a.cancel())}},[reduced]);
  return <section className="section-space" data-guide="Keep the CRM your team already uses. Astra Voice can handle the calling workflow and return the result." data-guide-title="Configured CRM workflow" data-guide-action="Show the flow" data-guide-tone="voice"><div className="site-container"><p className="eyebrow text-voice">CONFIGURED INTEGRATION</p><h2 className="section-title mt-4 max-w-3xl text-balance">Keep your CRM.<br/>Add an AI workforce.</h2><p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">Your team keeps working in the CRM they already use. Astra Voice handles the calls and returns the results.</p><div className="relative mt-12"><svg className="pointer-events-none absolute inset-0 hidden h-full w-full lg:block" viewBox="0 0 1200 330" preserveAspectRatio="none" aria-hidden="true"><path d="M110 165 C180 100 220 100 280 165 S420 230 480 165 S620 100 680 165 S820 230 890 165 S1030 100 1090 165" fill="none" stroke="currentColor" className="text-border" strokeWidth="1"/><path ref={pathRef} d="M110 165 C180 100 220 100 280 165 S420 230 480 165 S620 100 680 165 S820 230 890 165 S1030 100 1090 165" fill="none" stroke="currentColor" className="text-voice" strokeWidth="2"/><circle ref={signalRef} r="5" fill="currentColor" className="text-voice" style={{offsetPath:"path('M110 165 C180 100 220 100 280 165 S420 230 480 165 S620 100 680 165 S820 230 890 165 S1030 100 1090 165')",offsetRotate:"0deg"}}/></svg><ol className="relative grid gap-5 lg:grid-cols-[.95fr_.9fr_1.05fr_1.15fr_1.2fr] lg:items-center">{[
    <CrmCard key="start" end={false}/>,
    <div key="voice" className={cn("rounded-lg border bg-voice-soft p-5 transition-shadow",active===1?"border-voice shadow-panel":"border-voice/30")}><p className="eyebrow text-voice">ASTRA VOICE</p><div className="mt-5 flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full bg-card font-bold text-voice">M</span><div><b>Maya</b><p className="text-xs text-muted-foreground">AI Employee</p></div></div><dl className="mt-5 text-sm"><dt className="text-muted-foreground">Job</dt><dd className="font-semibold">Qualify enquiry</dd></dl><p className="mt-4 flex items-center gap-2 text-xs font-semibold text-voice"><i className="size-2 animate-pulse rounded-full bg-voice"/> Calling</p></div>,
    <div key="call" className={cn("rounded-lg border bg-guide p-5 text-guide-foreground transition-shadow",active===2?"border-voice shadow-guide":"border-guide-border")}><div className="flex items-center justify-between"><span className="flex items-center gap-2 text-xs font-semibold text-chat"><i className="size-2 rounded-full bg-chat"/> CONNECTED</span><span className="font-mono text-xs">02:18</span></div><p className="mt-4 font-semibold">Maya ↔ Arjun</p><div className="mt-5 flex h-7 items-center gap-1" aria-hidden="true">{[8,18,12,25,16,22,9,19,13].map((h,i)=><i key={i} className="w-1 rounded-full bg-voice" style={{height:h}}/>)}</div><blockquote className="mt-4 text-sm text-guide-muted">“We’d like a demo for our team this week.”</blockquote><p className="mt-3 text-[10px] text-guide-muted">ILLUSTRATIVE DEMO</p></div>,
    <div key="result" className={cn("rounded-lg border bg-card p-5 transition-shadow",active===3?"border-voice shadow-panel":"border-border")}><p className="flex items-center gap-2 font-bold text-voice"><Check className="size-5"/> QUALIFIED</p><dl className="mt-4 divide-y divide-border text-sm">{[["Interest","Product demo"],["Timing","This week"],["Next action","Sales follow-up"]].map(([k,v])=><div key={k} className="py-2"><dt className="text-xs text-muted-foreground">{k}</dt><dd className="font-semibold">{v}</dd></div>)}</dl><div className="mt-3 flex gap-2 text-[10px] text-voice"><span>“demo” → Interest</span><span>“this week” → Timing</span></div></div>,
    <CrmCard key="end" end/>,
  ].map((node,i)=><li key={i} className="relative">{node}{i<4&&<ArrowDown className="mx-auto my-2 text-voice lg:hidden"/>}</li>)}</ol></div><div className="mt-8 border-t border-border pt-5 text-sm text-muted-foreground"><p>Connect through API, webhooks or a configured integration.</p><p className="mt-1">Integration method depends on your existing CRM and workflow.</p></div></div></section>;
}

function CrmCard({end}:{end:boolean}){return <div className="rounded-lg border border-border bg-card p-5 shadow-sm"><p className="eyebrow">YOUR CRM</p><p className="mt-4 text-xs font-semibold text-muted-foreground">{end?"STATUS UPDATED":"NEW LEAD"}</p>{end?<dl className="mt-3 space-y-2 text-sm">{[["Status","Qualified"],["Summary","Interested in product demo"],["Next action","Sales follow-up"],["Owner","Sales team"]].map(([k,v])=><div key={k}><dt className="text-xs text-muted-foreground">{k}</dt><dd className="font-semibold">{v}</dd></div>)}</dl>:<><b className="mt-2 block text-lg">Arjun Mehta</b><p className="mt-1 text-sm text-muted-foreground">Product demo enquiry</p><span className="mt-5 inline-flex rounded-full bg-secondary px-2 py-1 text-xs">New</span></>}</div>}

const chatFeatures = [
  { Icon: UsersRound, name: "Contacts", copy: "Profiles, tags, notes and ownership beside every conversation." },
  { Icon: Workflow, name: "Deals", copy: "Move customers from new lead to won with visible next actions." },
  { Icon: Radio, name: "Broadcasts", copy: "Prepare approved, segmented outreach before anything is sent." },
  { Icon: MessageSquareText, name: "Templates", copy: "Keep helpful replies consistent without losing context." },
  { Icon: PlugZap, name: "Automation", copy: "Route, tag and assign conversations around your process." },
  { Icon: BarChart3, name: "Analytics", copy: "See response volume, ownership and pipeline movement." },
];

const solutionPreviews = [
  ["Lead qualification", "VOICE", "lead-qualification"],
  ["Sales follow-up", "BOTH", "sales-follow-up"],
  ["Customer support", "BOTH", "customer-support"],
  ["Appointments", "BOTH", "appointments"],
  ["Customer engagement", "CHAT", "customer-engagement"],
] as const;

export function ChatCapabilities() {
  const [active, setActive] = useState(0);
  const reduced = useReducedMotion();
  const current = chatFeatures[active] ?? chatFeatures[0];
  if (!current) return null;
  return <section className="border-y border-border bg-chat-soft py-24"><div className="mx-auto max-w-[1200px] px-5 lg:px-8"><ProductLogo product="chat"/><div className="mt-6 grid gap-8 lg:grid-cols-[.8fr_1.2fr]"><div><p className="eyebrow text-chat-dark">MORE THAN AN INBOX</p><h2 className="mt-4 text-balance text-4xl font-extrabold sm:text-5xl">Every chat moves the customer story forward.</h2><div className="mt-7 grid grid-cols-2 gap-2">{chatFeatures.map(({Icon,name},i)=><Button key={name} variant={active===i?"default":"outline"} className={cn("justify-start",active===i&&"bg-chat hover:bg-chat/90")} onClick={()=>setActive(i)}><Icon/>{name}</Button>)}</div></div><motion.div key={current.name} initial={reduced?false:{opacity:0,y:12}} animate={{opacity:1,y:0}} className="self-end rounded-lg border border-chat/30 bg-card p-7 shadow-panel"><current.Icon className="size-7 text-chat-dark"/><p className="eyebrow mt-8 text-chat-dark">ASTRA CHAT / {current.name.toUpperCase()}</p><h3 className="mt-2 text-3xl font-bold">{current.name}</h3><p className="mt-3 max-w-xl text-muted-foreground">{current.copy}</p><div className="mt-8 rounded-md border border-border bg-surface p-4"><div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3"><span className="truncate text-sm">Arjun Mehta · Demo request</span><span className="rounded-full bg-chat/15 px-2 py-1 text-xs text-chat-dark">Qualified</span></div><div className="mt-4 flex items-center gap-2 border-t border-border pt-4 text-sm text-muted-foreground"><Send className="size-4"/> Next action ready for sales</div></div><p className="mt-4 text-xs text-muted-foreground">ILLUSTRATIVE DEMO · LOCAL PREVIEW</p></motion.div></div></div></section>;
}

export function SolutionsPreview() {
  return <section className="py-24"><div className="site-container"><div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-end"><div><p className="eyebrow">SOLUTIONS</p><h2 className="mt-3 max-w-3xl text-balance text-4xl font-extrabold sm:text-5xl">Built around the job each conversation needs to do.</h2></div><Button asChild variant="outline"><Link to="/solutions">See all solutions <ArrowRight/></Link></Button></div><div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">{solutionPreviews.map(([name,product,slug],i)=><Link key={name} to="/solutions/$slug" params={{slug}} className={cn("rounded-lg border bg-card p-5 transition-shadow hover:shadow-panel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", i===0?"sm:col-span-2 lg:col-span-2 border-voice/30 bg-voice-soft":product==="CHAT"?"border-chat/30":"border-border")}><FileSpreadsheet className={cn("size-5",product==="VOICE"?"text-voice":product==="CHAT"?"text-chat-dark":"text-foreground")}/><span className="eyebrow mt-5 block">{product}</span><h3 className="mt-2 text-xl font-bold">{name}</h3>{i===0&&<p className="mt-2 text-sm text-muted-foreground">Qualify new enquiries within minutes, then hand off a clear next step.</p>}<span className="mt-5 inline-flex items-center gap-1 text-sm font-medium">Explore <ArrowRight className="size-4"/></span></Link>)}</div></div></section>;
}