import { createFileRoute } from "@tanstack/react-router";
import { Container, CtaBand, PageIntro, SolutionGrid } from "@/components/astra-pages";
export const Route = createFileRoute("/solutions/")({
  head:()=>({meta:[{title:"Solutions — AstraConnect"},{name:"description",content:"How teams use Astra Voice and Astra Chat for qualification, sales follow-up, support, appointments and engagement."},{property:"og:title",content:"Solutions — AstraConnect"},{property:"og:description",content:"Choose Astra Voice, Astra Chat, or both around the outcome your conversations need."},{property:"og:type",content:"website"},{property:"og:url",content:"https://astraconnect.io/solutions"},{name:"twitter:card",content:"summary_large_image"}],links:[{rel:"canonical",href:"https://astraconnect.io/solutions"}]}),
  component: () => <><PageIntro eyebrow="SOLUTIONS" title="Built around the job your conversations need to do." lead="Pick the outcome you care about. Each solution works with Astra Voice, Astra Chat, or both."/><Container className="pb-28"><SolutionGrid/></Container><CtaBand/></>,
});
