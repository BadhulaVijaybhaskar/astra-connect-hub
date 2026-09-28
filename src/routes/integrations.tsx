import { createFileRoute } from "@tanstack/react-router";
import { Container, CtaBand, PageIntro } from "@/components/astra-pages";
import { IntegrationArchitecture } from "@/components/astra-quality";
export const Route = createFileRoute("/integrations")({
  head:()=>({meta:[{title:"AstraConnect Integrations — Connect Your CRM & Workflows"},{name:"description",content:"Connect Astra Voice and Astra Chat around your CRM, lead sources, webhooks and existing business workflows."},{property:"og:title",content:"AstraConnect Integrations — Connect Your CRM & Workflows"},{property:"og:description",content:"Keep your CRM and configure AstraConnect around your existing workflow."},{property:"og:type",content:"website"},{property:"og:url",content:"https://astraconnect.io/integrations"},{name:"twitter:card",content:"summary_large_image"}],links:[{rel:"canonical",href:"https://astraconnect.io/integrations"}]}),
  component: () => <><PageIntro eyebrow="INTEGRATIONS" title="Keep your CRM. Connect Astra around your workflow." lead="Use configured connections to move customer context and outcomes between AstraConnect and the business systems your team already uses."/><Container className="pb-24"><IntegrationArchitecture/></Container><CtaBand/></>,
});
