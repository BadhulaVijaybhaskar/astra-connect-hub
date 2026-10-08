import { useMemo } from "react";
import { computeAnalytics } from "@/lib/data-collection/analytics";
import type { CallResult, DataField } from "@/lib/data-collection/types";
import { SampleBadge } from "./status-badge";

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** Phase 1 analytics stub: totals + per-field breakdowns from structured fields. */
export function AnalyticsPanel({
  fields,
  results,
}: {
  fields: DataField[];
  results: CallResult[];
}) {
  const a = useMemo(() => computeAnalytics(fields, results), [fields, results]);
  if (!results.length)
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
        Analytics are calculated from structured answers once calls come in. Nothing to show yet.
      </div>
    );
  const charted = a.fields.filter((f) => f.distribution.length > 0);
  const others = a.fields.filter((f) => f.distribution.length === 0);
  return (
    <div className="grid gap-4">
      {a.sampleOnly && (
        <p className="rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm">
          <SampleBadge className="mr-2" />
          These numbers come from sample rows only. They are not live results.
        </p>
      )}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Total calls" value={String(a.totalCalls)} hint={`${a.connected} connected`} />
        <Kpi label="Completed responses" value={String(a.complete)} />
        <Kpi
          label="Partial responses"
          value={String(a.partial)}
          hint={`${a.noResponse} with no answers`}
        />
        <Kpi label="Completion rate" value={`${a.completionRate}%`} />
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {charted.map((f) => (
          <section key={f.key} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="font-semibold">{f.label}</h3>
              <span className="text-xs text-muted-foreground tabular-nums">
                {f.answered} answered{f.average !== null ? ` · avg ${f.average}` : ""}
              </span>
            </div>
            <ul className="mt-3 grid gap-2">
              {f.distribution.map((d) => (
                <li
                  key={d.value}
                  className="grid grid-cols-[minmax(6rem,10rem)_1fr_3.5rem] items-center gap-2 text-sm"
                >
                  <span className="truncate" title={d.value}>
                    {d.value}
                  </span>
                  <span className="h-2 overflow-hidden rounded-full bg-muted">
                    <span
                      className="block h-full rounded-full bg-voice"
                      style={{ width: `${d.pct}%` }}
                    />
                  </span>
                  <span className="text-right tabular-nums text-muted-foreground">{d.pct}%</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      {others.length > 0 && (
        <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <h3 className="font-semibold">Open answers</h3>
          <ul className="mt-2 grid gap-x-10 gap-y-1 text-sm sm:grid-cols-2">
            {others.map((f) => (
              <li key={f.key} className="flex justify-between gap-2">
                <span>{f.label}</span>
                <span className="tabular-nums text-muted-foreground">
                  {f.answered} answered{f.average !== null ? ` · avg ${f.average}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
