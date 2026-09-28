import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  FileText,
  Menu,
  MessageCircle,
  MoreHorizontal,
  Paperclip,
  Phone,
  Search,
  Send,
  Settings,
  Sparkles,
  UserRound,
  UsersRound,
  Video,
  X,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Cell, Funnel, FunnelChart, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export { ConnectedStory } from "@/components/astra-connected-journey";

export const brandAssets = { connect: "/brand/astraconnect-lockup.png?v=2", voice: "/brand/astra-voice-lockup.png", chat: "/brand/astra-chat-lockup.png", mark: "/brand/ac-mark.png" };
const solutionLinks = [["lead-qualification","Lead qualification"],["sales-follow-up","Sales follow-up"],["customer-support","Customer support"],["appointments","Appointments"],["customer-engagement","Customer engagement"]] as const;

export function DemoDialog({ children }: { children: ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md rounded-lg border-border bg-background p-7">
        <DialogHeader>
          <DialogTitle className="text-2xl">Book an AstraConnect demo</DialogTitle>
          <DialogDescription>Choose the product you want to explore, then tell us only what is relevant.</DialogDescription>
        </DialogHeader>
        <Button asChild className="mt-3 h-11 w-full"><Link to="/book-demo">Open demo request form <ArrowRight /></Link></Button>
      </DialogContent>
    </Dialog>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [compact, setCompact] = useState(false);
  const reduce = useReducedMotion();
  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur">
      <div className={cn("site-container grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 transition-[height]", compact ? "h-16" : "h-20")}>
        <Link to="/" className="min-w-0" aria-label="AstraConnect home">
          <img src={brandAssets.connect} alt="AstraConnect" className="h-9 w-auto max-w-[62vw] object-contain object-left sm:h-10 sm:max-w-[300px]" />
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium md:flex" aria-label="Main navigation">
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" className="px-2">Products <ChevronDown /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-80">
               <DropdownMenuItem asChild><Link to="/astra-voice" className="items-start py-3"><Phone className="mt-0.5 text-voice"/><span><b className="block">Astra Voice</b><small className="text-muted-foreground">AI employees for business calls</small></span></Link></DropdownMenuItem>
               <DropdownMenuItem asChild><Link to="/astra-chat" className="items-start py-3"><MessageCircle className="mt-0.5 text-chat-dark"/><span><b className="block">Astra Chat</b><small className="text-muted-foreground">WhatsApp CRM for customer conversations</small></span></Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link to="/" hash="connected" className="items-start py-3"><Sparkles className="mt-0.5"/><span><b className="block">Connected setup</b><small className="text-muted-foreground">Voice + WhatsApp, configured together</small></span></Link></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" className="px-2">Solutions <ChevronDown/></Button></DropdownMenuTrigger><DropdownMenuContent align="center" className="w-64">{solutionLinks.map(([slug,label],i)=><DropdownMenuItem key={slug} asChild><Link to="/solutions/$slug" params={{slug}}><span className={cn("size-2 rounded-full",i<2?"bg-voice":i===4?"bg-chat":"bg-gradient-to-r from-voice to-chat")}/>{label}</Link></DropdownMenuItem>)}</DropdownMenuContent></DropdownMenu>
          <Link to="/integrations" className="story-link">Integrations</Link>
          <Link to="/pricing" className="story-link">Pricing</Link>
          <Button asChild className="h-10 px-5"><Link to="/book-demo">Book demo <ArrowRight /></Link></Button>
        </nav>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen((value) => !value)}>{open ? <X /> : <Menu />}</Button>
      </div>
      <AnimatePresence>{open && (
        <motion.nav initial={reduce ? false : { opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? {opacity:0}:{opacity:0,y:-8}} className="grid gap-1 border-t border-border bg-background p-4 md:hidden" aria-label="Mobile navigation">
          <Link to="/astra-voice" className="rounded-md px-3 py-3 font-medium" onClick={() => setOpen(false)}>Astra Voice</Link>
          <Link to="/astra-chat" className="rounded-md px-3 py-3 font-medium" onClick={() => setOpen(false)}>Astra Chat</Link>
          <Link to="/" hash="connected" className="rounded-md px-3 py-3 font-medium" onClick={() => setOpen(false)}>Connected setup</Link>
          {([["/solutions","Solutions"],["/integrations","Integrations"],["/pricing","Pricing"],["/security","Security"]] as const).map(([to,l])=><Link key={to} to={to} className="rounded-md px-3 py-3 font-medium" onClick={() => setOpen(false)}>{l}</Link>)}
          <Button asChild className="mt-2 w-full"><Link to="/book-demo" onClick={() => setOpen(false)}>Book demo <ArrowRight /></Link></Button>
        </motion.nav>
      )}</AnimatePresence>
    </header>
  );
}

export function Footer() {
  const staticGroups=[
    ["Products",[["/astra-voice","Astra Voice"],["/astra-chat","Astra Chat"]]],
    ["Company",[["/integrations","Integrations"],["/pricing","Pricing"],["/book-demo","Book demo"]]],
    ["Legal",[["/security","Security"],["/privacy","Privacy"],["/terms","Terms"]]],
  ] as const;
  return <footer className="border-t border-guide-border bg-guide text-guide-foreground"><div className="site-container grid gap-10 py-14 lg:grid-cols-[1.3fr_repeat(4,1fr)]"><div><img src={brandAssets.mark} alt="AstraConnect" className="h-10 w-auto object-contain" /><p className="mt-5 max-w-xs text-sm leading-relaxed text-guide-muted">AI-powered customer communication products for businesses.</p><p className="mt-3 text-xs text-guide-muted">A product of Astranova Digital Services.</p></div>{staticGroups.slice(0,1).map(([heading,links])=><FooterGroup key={heading} heading={heading} links={links}/>)}<nav aria-label="Solutions links"><p className="eyebrow text-guide-muted">SOLUTIONS</p><div className="mt-4 grid gap-3">{solutionLinks.map(([slug,label])=><Link key={slug} to="/solutions/$slug" params={{slug}} className="text-sm text-guide-muted transition-colors hover:text-guide-foreground">{label}</Link>)}</div></nav>{staticGroups.slice(1).map(([heading,links])=><FooterGroup key={heading} heading={heading} links={links}/>)}</div><div className="border-t border-guide-border"><div className="site-container flex flex-col gap-2 py-5 text-xs text-guide-muted sm:flex-row sm:justify-between"><span>� 2026 AstraConnect.</span><span>A product of Astranova Digital Services.</span></div></div></footer>;
}

function FooterGroup({heading,links}:{heading:string;links:readonly (readonly ["/astra-voice"|"/astra-chat"|"/integrations"|"/pricing"|"/book-demo"|"/security"|"/privacy"|"/terms",string])[]}) {
  return <nav aria-label={`${heading} links`}><p className="eyebrow text-guide-muted">{heading.toUpperCase()}</p><div className="mt-4 grid gap-3">{links.map(([to,label])=><Link key={to} to={to} className="text-sm text-guide-muted transition-colors hover:text-guide-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{label}</Link>)}</div></nav>;
}

export function ProductLogo({ product, className }: { product: "voice" | "chat"; className?: string }) {
  return <img src={brandAssets[product]} alt={product === "voice" ? "Astra Voice" : "Astra Chat"} className={cn("h-10 w-auto object-contain object-left", className)} />;
}

function WindowFrame({ children, label = "Interactive product demo", className }: { children: ReactNode; label?: string; className?: string }) {
  return <div className={cn("overflow-hidden rounded-lg border border-border bg-card shadow-panel", className)}><div className="grid grid-cols-[minmax(0,1fr)_auto] items-center border-b border-border px-4 py-2 text-xs text-muted-foreground"><span className="truncate">{label}</span><span className="flex gap-1.5" aria-hidden="true"><i className="size-2 rounded-full bg-destructive"/><i className="size-2 rounded-full bg-warning"/><i className="size-2 rounded-full bg-success"/></span></div>{children}</div>;
}

export function VoicePreview({ compact = false }: { compact?: boolean }) {
  const [active, setActive] = useState(false);
  return <div className={cn("rounded-lg border border-voice/25 bg-voice-soft p-4", compact && "h-full")}>
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3"><ProductLogo product="voice" /><span className="rounded-full bg-voice/10 px-3 py-1 text-xs font-medium text-voice">AI employee</span></div>
    <p className="mt-3 font-semibold">Turn calls into customers with AI employees.</p>
    <div className="mt-3 grid gap-3 sm:grid-cols-[.8fr_1.2fr]">
      <div className="rounded-md border border-border bg-card p-3"><div className="flex items-center gap-2 text-xs text-voice"><Phone className="size-4"/> Incoming call <span className="ml-auto tabular-nums">00:08</span></div><div className="mt-4 flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full bg-voice/10 font-semibold">AM</span><div><b className="text-sm">Arjun Mehta</b><p className="text-xs text-muted-foreground">Acme Retail · Bengaluru</p></div></div><Button size="sm" className="mt-4 w-full bg-voice hover:bg-voice/90" onClick={() => setActive((v) => !v)}>{active ? <><X /> End call</> : <><Phone /> Answer call</>}</Button></div>
      <motion.div layout className="rounded-md border border-border bg-card p-3"><div className="flex items-center gap-2"><span className="grid size-8 place-items-center rounded-full bg-voice/10 text-voice"><Sparkles className="size-4"/></span><div><b className="text-sm">Maya</b><p className="text-xs text-muted-foreground">Lead qualification</p></div></div><p className="mt-3 rounded-md bg-voice-soft p-3 text-xs leading-relaxed">{active ? "Hi Arjun, Maya from Astra here. What would make a new sales system valuable for your team?" : "Ready to qualify new enquiries and book meetings, 24/7."}</p><div className="mt-4 flex h-8 items-center gap-1" aria-label="Call audio waveform">{[9,17,25,13,29,20,10,18,26,12,19,8].map((height,index)=><motion.i key={index} animate={{ height: active ? [height, Math.max(8, 34-height), height] : 6 }} transition={{ repeat: active ? Infinity : 0, duration: .8, delay: index*.04 }} className="w-1 rounded-full bg-voice" />)}</div></motion.div>
    </div>
  </div>;
}

const contacts = [
  { initials: "AM", name: "Arjun Mehta", note: "Can we arrange a demo?", time: "11:24 AM" },
  { initials: "PS", name: "Priya Sharma", note: "Thanks for the details!", time: "10:41 AM" },
  { initials: "RV", name: "Rahul Verma", note: "When can we get started?", time: "9:18 AM" },
];

export function ChatPreview({ compact = false }: { compact?: boolean }) {
  const [selected, setSelected] = useState(0);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState<string[]>([]);
  const activeContact = contacts[selected] ?? { initials: "AM", name: "Arjun Mehta", note: "", time: "" };
  return <div className={cn("rounded-lg border border-chat/25 bg-chat-soft p-4", compact && "h-full")}>
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3"><ProductLogo product="chat"/><span className="rounded-full bg-chat/10 px-3 py-1 text-xs font-medium text-chat-dark">Dedicated CRM</span></div>
    <p className="mt-3 font-semibold">Turn WhatsApp conversations into customers.</p>
    <div className="mt-3 grid gap-3 sm:grid-cols-[.85fr_1.15fr]">
      <div className="rounded-md border border-border bg-card p-2"><div className="flex items-center gap-2 px-2 py-1 text-xs font-semibold"><MessageCircle className="size-4 text-chat"/> WhatsApp Inbox <Search className="ml-auto size-4 text-muted-foreground"/></div>{contacts.slice(0, compact ? 3 : undefined).map((contact,index)=><button type="button" key={contact.name} onClick={()=>setSelected(index)} className={cn("mt-1 grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-md p-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",selected===index&&"bg-chat-soft")}><span className="grid size-8 place-items-center rounded-full bg-chat/15 text-xs font-medium">{contact.initials}</span><span className="min-w-0"><b className="block truncate text-xs">{contact.name}</b><span className="block truncate text-[11px] text-muted-foreground">{contact.note}</span></span><span className="text-[9px] text-muted-foreground">{contact.time}</span></button>)}</div>
      <div className="flex min-h-56 flex-col rounded-md border border-border bg-card"><div className="flex items-center gap-2 border-b border-border p-3"><span className="grid size-8 place-items-center rounded-full bg-chat/15 text-xs">{activeContact.initials}</span><b className="text-sm">{activeContact.name}</b><Video className="ml-auto size-4"/><Phone className="size-4"/><MoreHorizontal className="size-4"/></div><div className="flex flex-1 flex-col gap-2 p-3 text-xs"><span className="max-w-[78%] rounded-md bg-secondary p-2">Hi! I’d like to see how AstraConnect works.</span><span className="ml-auto max-w-[78%] rounded-md bg-chat-soft p-2">Absolutely — what works best for your team?</span>{sent.map((text)=><motion.span initial={{opacity:0,y:5}} animate={{opacity:1,y:0}} key={text} className="ml-auto max-w-[78%] rounded-md bg-chat-soft p-2">{text}</motion.span>)}</div><form className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 border-t border-border p-2" onSubmit={(event)=>{event.preventDefault(); if(message.trim()){setSent((values)=>[...values,message]);setMessage("");}}}><Paperclip className="size-4 text-muted-foreground"/><Input value={message} onChange={(event)=>setMessage(event.target.value)} className="h-8 border-0 shadow-none" placeholder="Type a message…" aria-label="Message"/><Button size="icon" className="size-8 bg-chat hover:bg-chat/90" aria-label="Send message"><Send/></Button></form></div>
    </div>
  </div>;
}

export function AstraGuide() {
  const reduceMotion = useReducedMotion();
  const [position, setPosition] = useState({ x: 0, y: 0 });
  return <motion.div onPointerMove={(event)=>{const rect=event.currentTarget.getBoundingClientRect();setPosition({x:(event.clientX-rect.left-rect.width/2)*.08,y:(event.clientY-rect.top-rect.height/2)*.08})}} className="relative grid min-h-52 place-items-center overflow-hidden rounded-lg border border-border bg-guide text-guide-foreground">
    <div className="absolute inset-x-0 top-1/2 h-px bg-guide-border"/><motion.div animate={reduceMotion?{}:{x:position.x,y:position.y}} transition={{type:"spring",stiffness:120,damping:18}} className="relative grid size-24 place-items-center rounded-full border border-guide-border bg-guide shadow-guide"><span className="absolute inset-3 rounded-full border-2 border-voice border-r-chat"/><Sparkles className="size-6"/></motion.div><div className="absolute bottom-5 text-center"><b>Astra Guide</b><p className="text-xs text-guide-muted">Voice and chat, connected around the next step.</p></div>
  </motion.div>;
}

export const callData = [{name:"Qualified",value:46,color:"var(--voice)"},{name:"Follow-up",value:31,color:"var(--chat)"},{name:"Not now",value:23,color:"var(--muted-foreground)"}];
export const funnelData = [{name:"Conversations",value:128,fill:"var(--voice)"},{name:"Qualified",value:74,fill:"var(--chat)"},{name:"Meetings",value:38,fill:"var(--success)"}];

export function OutcomeCharts({ accent = "voice" }: { accent?: "voice" | "chat" }) {
  return <section id="analytics" className="border-y border-border bg-surface py-20"><div className="mx-auto max-w-[1200px] px-5 lg:px-8"><p className="mb-4 text-xs font-semibold text-muted-foreground">ILLUSTRATIVE DEMO · SAMPLE DATA</p><div className="grid gap-5 lg:grid-cols-2"><div className="rounded-lg border border-border bg-card p-5"><div className="flex items-start justify-between"><div><p className="eyebrow">CALL OUTCOMES</p><h3 className="mt-2 text-2xl font-bold">Every conversation, measured.</h3></div><BarChart3 className={accent==="voice"?"text-voice":"text-chat"}/></div><div className="mt-5 h-64" role="img" aria-label="Call outcomes: 46 percent qualified, 31 percent follow-up, 23 percent not now"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={callData} dataKey="value" innerRadius={58} outerRadius={88} paddingAngle={3}>{callData.map((item)=><Cell key={item.name} fill={item.color}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer></div><div className="flex justify-center gap-4 text-xs">{callData.map((item)=><span key={item.name} className="flex items-center gap-1.5"><i className="size-2 rounded-full" style={{background:item.color}}/>{item.name} {item.value}%</span>)}</div></div><div className="rounded-lg border border-border bg-card p-5"><p className="eyebrow">SALES FUNNEL</p><h3 className="mt-2 text-2xl font-bold">From contact to meeting.</h3><div className="mt-5 h-64" role="img" aria-label="Sales funnel: 128 conversations, 74 qualified leads, 38 meetings"><ResponsiveContainer width="100%" height="100%"><FunnelChart><Tooltip/><Funnel dataKey="value" data={funnelData}/></FunnelChart></ResponsiveContainer></div><div className="grid grid-cols-3 gap-2 text-center">{funnelData.map((item)=><div key={item.name}><b className="block text-xl tabular-nums">{item.value}</b><span className="text-xs text-muted-foreground">{item.name}</span></div>)}</div></div></div></div></section>;
}

export { ChatWorkspace, VoiceWorkspace } from "@/components/astra-workspaces";