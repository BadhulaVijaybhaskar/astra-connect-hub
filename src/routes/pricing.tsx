import { createFileRoute } from "@tanstack/react-router";
import { Container, CtaBand, PageIntro, PricingTabs } from "@/components/astra-pages";
export const Route = createFileRoute("/pricing")({
  head:()=>({meta:[{title:"AstraConnect Pricing — Astra Voice & Astra Chat"},{name:"description",content:"Choose Astra Voice, Astra Chat, or a connected setup. Pricing is quoted around your volume and configuration."},{property:"og:title",content:"AstraConnect Pricing — Astra Voice & Astra Chat"},{property:"og:description",content:"Buy one AstraConnect product or configure both around your customer journey."},{property:"og:type",content:"website"},{property:"og:url",content:"https://astraconnect.io/pricing"},{name:"twitter:card",content:"summary_large_image"}],links:[{rel:"canonical",href:"https://astraconnect.io/pricing"}]}),
  component: () => <><PageIntro eyebrow="PRICING" title="Buy one product. Or both." lead="Each product is priced on its own. We quote after understanding your volumes, so you only pay for what you use."/><Container className="pb-20"><PricingTabs/></Container><CtaBand/></>,
});
