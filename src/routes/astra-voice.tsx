import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { DemoDialog, OutcomeCharts, VoiceWorkspace } from "@/components/astra-site";
import { Button } from "@/components/ui/button";
import { CampaignSimulator, ConversationToData } from "@/components/astra-story";
import { FinalProductCta, VoiceInputs, VoicePaths, VoiceTeachStory } from "@/components/astra-quality";

export const Route = createFileRoute("/astra-voice")({
  head:()=>({meta:[{title:"Astra Voice — AI Employees for Business Calls"},{name:"description",content:"Create an AI employee that qualifies leads, answers questions, and books meetings."},{property:"og:title",content:"Astra Voice — Give the conversation a job"},{property:"og:description",content:"Teach an AI employee your business and put every call to work."},{property:"og:type",content:"product"},{property:"og:url",content:"https://astraconnect.io/astra-voice"},{name:"twitter:card",content:"summary_large_image"}],links:[{rel:"canonical",href:"https://astraconnect.io/astra-voice"}]}),
  component: VoicePage,
});

function VoicePage(){return <>
  <section className="site-container pb-12 pt-16 sm:pt-20"><div className="grid items-center gap-10 lg:grid-cols-[.7fr_1.3fr]"><motion.div initial={{opacity:0,y:14}} animate={{opacity:1,y:0}}><p className="eyebrow text-voice">ASTRA VOICE</p><h1 className="page-title mt-5 max-w-[16ch] text-balance">Give the conversation a job.</h1><p className="mt-6 max-w-xl text-pretty text-xl leading-relaxed text-muted-foreground">Create an AI employee.<br/>Teach it your business.<br/>Put it to work.</p><DemoDialog><Button size="lg" className="mt-8 bg-voice hover:bg-voice/90">Build your AI employee <ArrowRight/></Button></DemoDialog></motion.div><div className="rounded-lg border border-voice/30 bg-voice-soft p-6 shadow-panel"><p className="eyebrow text-voice">EMPLOYEE STUDIO · ILLUSTRATIVE DEMO</p><div className="mt-7 flex items-center gap-4"><span className="grid size-16 place-items-center rounded-full bg-card text-2xl font-bold text-voice">M</span><div><h2 className="text-3xl font-bold">Maya</h2><p className="text-muted-foreground">Lead qualification · Ready</p></div></div><div className="mt-8 grid gap-2 sm:grid-cols-3">{["Instructions ready","Knowledge added","Outcome fields set"].map(x=><div key={x} className="rounded-md bg-card p-3 text-sm font-semibold">{x}</div>)}</div></div></div></section>
  <section className="site-container pb-20 pt-8" data-guide="Click a step to see how an AI employee is set up." data-guide-tone="voice"><p className="eyebrow text-voice">HOW IT WORKS</p><h2 className="section-title mb-10 mt-4">Create. Teach. Choose voice. Connect. Capture.</h2><VoiceWorkspace/></section>
  <VoiceTeachStory/><VoiceInputs/><ConversationToData/><CampaignSimulator/><VoicePaths/>
  <OutcomeCharts accent="voice"/>
  <FinalProductCta product="voice"/>
</>}
