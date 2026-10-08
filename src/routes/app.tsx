import { Link, Outlet, createFileRoute } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { brandAssets } from "@/components/astra-site";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [{ title: "AI Employees · AstraConnect" }, { name: "robots", content: "noindex" }],
  }),
  component: AppLayout,
});

/** Light SaaS product chrome for the AI Employees console. No marketing header, footer or Guide. */
function AppLayout() {
  return (
    <div className="min-h-svh bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1200px] items-center gap-6 px-4 lg:px-8">
          <Link to="/" className="flex items-center gap-2" aria-label="AstraConnect home">
            <img src={brandAssets.mark} alt="" className="size-7" />
            <span className="text-sm font-semibold">AstraConnect</span>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <Link
              to="/app/employees"
              className="rounded-md px-3 py-1.5 font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              activeProps={{ className: "bg-voice-soft text-voice" }}
            >
              AI Employees
            </Link>
          </nav>
        </div>
      </header>
      <Outlet />
      <Toaster position="bottom-right" />
    </div>
  );
}
