import { Link, createFileRoute } from "@tanstack/react-router";
import { Plus, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { StoreModeNote } from "@/components/employees/store-mode-note";
import { useRepository } from "@/components/employees/use-repository";
import { Button } from "@/components/ui/button";
import { VERTICAL_TEMPLATES } from "@/lib/data-collection/catalog";
import type { EmployeeDraft } from "@/lib/data-collection/types";

export const Route = createFileRoute("/app/employees/")({
  head: () => ({ meta: [{ title: "AI Employees · AstraConnect" }] }),
  component: EmployeesPage,
});

function EmployeesPage() {
  const repo = useRepository();
  const [list, setList] = useState<EmployeeDraft[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!repo) return;
    repo
      .listEmployees()
      .then(setList, (e: unknown) =>
        setError(e instanceof Error ? e.message : "Couldn't load employees"),
      );
  }, [repo]);

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">AI Employees</h1>
          <p className="text-sm text-muted-foreground">
            Describe a job in plain language. AstraConnect sets up the questions, fields, workflow
            and results.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StoreModeNote mode={repo?.mode ?? null} />
          <Button asChild className="bg-voice text-voice-foreground hover:bg-voice/90">
            <Link to="/app/employees/new">
              <Plus /> Create employee
            </Link>
          </Button>
        </div>
      </div>
      <div className="mt-6">
        {error ? (
          <p className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </p>
        ) : list === null ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
            <UserRound className="mx-auto size-8 text-muted-foreground" aria-hidden />
            <p className="mt-2 font-semibold">No AI Employees yet</p>
            <p className="text-sm text-muted-foreground">
              Create your first one in a few guided steps.
            </p>
            <Button asChild className="mt-4 bg-voice text-voice-foreground hover:bg-voice/90">
              <Link to="/app/employees/new">
                <Plus /> Create employee
              </Link>
            </Button>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((e) => (
              <li key={e.id}>
                <Link
                  to="/app/employees/$employeeId"
                  params={{ employeeId: e.id }}
                  className="block rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-voice/40"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-full bg-voice-soft font-semibold text-voice">
                      {e.name.slice(0, 1).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{e.name}</p>
                      <p className="truncate text-sm text-muted-foreground">{e.role}</p>
                    </div>
                    <span className="ml-auto rounded-md border border-border px-2 py-0.5 text-xs capitalize text-muted-foreground">
                      {e.status === "published" ? "Ready" : "Draft"}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {VERTICAL_TEMPLATES[e.vertical]?.label ?? "Custom"} · {e.fields.length} fields
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
