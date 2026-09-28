import { createFileRoute } from "@tanstack/react-router";
import { BookDemoForm, Container, PageIntro } from "@/components/astra-pages";
export const Route = createFileRoute("/book-demo")({
  head:()=>({meta:[{title:"Book an AstraConnect Demo"},{name:"description",content:"Tell us about your business calls, WhatsApp conversations, or both, and we will tailor an AstraConnect demo."},{property:"og:title",content:"Book an AstraConnect Demo"},{property:"og:description",content:"Choose Astra Voice, Astra Chat, or both and request a tailored product walkthrough."},{property:"og:type",content:"website"},{property:"og:url",content:"https://astraconnect.io/book-demo"},{name:"twitter:card",content:"summary_large_image"}],links:[{rel:"canonical",href:"https://astraconnect.io/book-demo"}]}),
  component: () => <><PageIntro eyebrow="BOOK A DEMO" title="What would you like to handle better?" lead="Choose business calls, WhatsApp conversations, or both. We’ll only ask what’s relevant."/><Container className="max-w-3xl pb-20"><BookDemoForm/></Container></>,
});
