import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { CtaBand, SolutionDetail, solutions } from "@/components/astra-pages";
export const Route = createFileRoute("/solutions/$slug")({
  loader: ({ params }) => { const s = solutions.find((x) => x.slug === params.slug); if (!s) throw notFound(); return { slug: s.slug }; },
  head: ({ loaderData }) => { const s = solutions.find((x) => x.slug === loaderData?.slug); if (!s) return { meta: [{ title: "Solution not found — AstraConnect" }, { name: "robots", content: "noindex" }] }; const t = `${s.title} — AstraConnect Solutions`; const path=`/solutions/${s.slug}`; return { meta: [{ title: t }, { name: "description", content: s.short }, { property: "og:title", content: t }, { property: "og:description", content: s.lead }, { property: "og:type", content: "website" }, { property:"og:url",content:path }, { name: "twitter:card", content: "summary_large_image" }],links:[{rel:"canonical",href:path}] }; },
  notFoundComponent: SolutionMissing,
  component: SolutionPage,
});
function SolutionPage() { const { slug } = Route.useLoaderData(); const s = solutions.find((x) => x.slug === slug); if(!s) return <SolutionMissing/>; return <><SolutionDetail s={s}/><CtaBand/></>; }
function SolutionMissing() { return <div className="mx-auto max-w-xl px-5 py-24 text-center"><h1 className="text-3xl font-bold">Solution not found</h1><Link to="/solutions" className="mt-4 inline-block underline">See all solutions</Link></div>; }
