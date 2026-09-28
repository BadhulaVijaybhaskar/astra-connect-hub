import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { ConnectedStory, DemoDialog, OutcomeCharts } from "@/components/astra-site";
import { AstraHero } from "@/components/astra-hero";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { CampaignSimulator, ConversationToData } from "@/components/astra-story";
import { ChatCapabilities, CrmWorkflow, ProductSelector, SolutionsPreview, VoiceStory } from "@/components/astra-experience";

export const Route = createFileRoute("/")({
  head: () => ({meta:[
    {title:"AstraConnect — AI Calling & WhatsApp CRM"},
    {name:"description",content:"Turn business calls and WhatsApp conversations into qualified meetings with Astra Voice and Astra Chat."},
    {property:"og:title",content:"AstraConnect — AI Calling & WhatsApp CRM"},
    {property:"og:description",content:"Two focused sales products, connected around your customer journey."},
    {property:"og:type",content:"website"},{property:"og:url",content:"https://astraconnect.io/"},{name:"twitter:card",content:"summary_large_image"},
  ],links:[{rel:"canonical",href:"https://astraconnect.io/"}],scripts:[{type:"application/ld+json",children:JSON.stringify({"@context":"https://schema.org","@type":"WebSite",name:"AstraConnect",url:"https://astraconnect.io",description:"AI employees for business calls and a dedicated CRM for WhatsApp customer conversations."})}]}),
  component: Index,
});

function Index() {
  return (
    <>
      <AstraHero />
      <ProductSelector/>
      <VoiceStory/>
      <CampaignSimulator/>
      <ConversationToData/>
      <CrmWorkflow/>
      <ChatCapabilities/>
      <div data-guide="Connect both products for one history across calls and chats." data-guide-tone="both"><ConnectedStory/></div>
      <OutcomeCharts/>
      <SolutionsPreview/>
       <section id="pricing" className="section-space text-center" data-guide="Tell us what you want to improve. We'll ask only what's relevant." data-guide-tone="both"><div className="site-container"><p className="eyebrow">CONFIGURED AROUND YOUR TEAM</p><h2 className="section-title mx-auto mt-4 max-w-3xl text-balance">What would you like to handle better?</h2><div className="mx-auto mt-8 grid max-w-3xl gap-3 sm:grid-cols-3">{["Business calls","WhatsApp conversations","Both"].map((label,i)=><Link key={label} to="/book-demo" className="rounded-lg border border-border bg-card p-5 text-left font-semibold transition-shadow hover:shadow-panel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><span className={i===0?"text-voice":i===1?"text-chat-dark":"text-foreground"}>0{i+1}</span><span className="mt-6 block">{label}</span></Link>)}</div><DemoDialog><Button size="lg" className="mt-7">Book your walkthrough <ArrowRight/></Button></DemoDialog></div></section>
    </>
  );
}
