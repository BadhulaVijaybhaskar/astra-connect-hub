import {
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Search,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { COMPLETION_LABEL, completionOf } from "@/lib/data-collection/analytics";
import {
  EMPTY_FILTERS,
  filterResults,
  formatDuration,
  formatTimestamp,
  type ResultsFilterState,
} from "@/lib/data-collection/results";
import { buildExportRows, exportFilename, SOURCE_LABEL, toCsv } from "@/lib/data-collection/export";
import { formatValue } from "@/lib/data-collection/normalize";
import {
  CALL_STATUSES,
  type CallResult,
  type CallStatus,
  type DataField,
} from "@/lib/data-collection/types";
import { buildXlsx } from "@/lib/data-collection/xlsx";
import { cn } from "@/lib/utils";
import { SampleBadge, StatusBadge } from "./status-badge";

function download(name: string, data: BlobPart, type: string) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function ResultsView({
  employeeName,
  fields,
  results,
  loading,
  onLoadSample,
  onClearSample,
}: {
  employeeName: string;
  fields: DataField[];
  results: CallResult[];
  loading: boolean;
  onLoadSample: () => void;
  onClearSample: () => void;
}) {
  const [filters, setFilters] = useState<ResultsFilterState>(EMPTY_FILTERS);
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(0);
  const [detail, setDetail] = useState<CallResult | null>(null);

  const campaigns = useMemo(
    () => [...new Set(results.map((r) => r.campaign).filter(Boolean))],
    [results],
  );
  const filtered = useMemo(
    () => filterResults(results, fields, filters),
    [results, fields, filters],
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = filtered.slice(page * pageSize, page * pageSize + pageSize);
  const hasSample = results.some((r) => r.source === "sample");
  const active =
    filters.query ||
    filters.statuses.length ||
    filters.from ||
    filters.to ||
    filters.campaign !== "all" ||
    filters.completion !== "all" ||
    filters.requiredComplete;

  const update = (patch: Partial<ResultsFilterState>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(0);
  };

  const doExport = (kind: "csv" | "xlsx", includeRaw = false) => {
    const { columns, rows } = buildExportRows(fields, filtered, { includeRaw });
    if (kind === "csv")
      download(exportFilename(employeeName, "csv"), toCsv(columns, rows), "text/csv;charset=utf-8");
    else
      download(
        exportFilename(employeeName, "xlsx"),
        buildXlsx(columns, rows) as BlobPart,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
  };

  if (loading)
    return (
      <div className="grid gap-2" aria-busy>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-11 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );

  if (!results.length)
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
        <p className="font-semibold">No calls yet.</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          Results appear here as soon as {employeeName || "this employee"} completes a call. Each
          call becomes one row and each Data Collection field becomes one column.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Button variant="outline" onClick={onLoadSample}>
            Load sample rows (clearly labelled)
          </Button>
        </div>
      </div>
    );

  return (
    <div className="grid gap-3">
      {hasSample && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm">
          <span>
            <SampleBadge className="mr-2" />
            Rows marked Sample are seeded demo data, not live calls. Exports label them “Sample (not
            live)”.
          </span>
          <Button size="sm" variant="ghost" onClick={onClearSample}>
            Clear sample rows
          </Button>
        </div>
      )}
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-2 rounded-xl border border-border bg-card p-3 shadow-sm">
        <div className="relative min-w-[12rem] flex-1">
          <Search
            className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={filters.query}
            onChange={(e) => update({ query: e.target.value })}
            placeholder="Search contact, phone, call ID or answer"
            className="pl-8"
            aria-label="Search results"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Status{filters.statuses.length ? ` · ${filters.statuses.length}` : ""}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Status</DropdownMenuLabel>
            {CALL_STATUSES.map((s) => (
              <DropdownMenuCheckboxItem
                key={s}
                checked={filters.statuses.includes(s)}
                onSelect={(e) => e.preventDefault()}
                onCheckedChange={(v) =>
                  update({
                    statuses: v
                      ? [...filters.statuses, s]
                      : filters.statuses.filter((x) => x !== s),
                  })
                }
              >
                {s}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Select
          value={filters.completion}
          onValueChange={(v) => update({ completion: v as ResultsFilterState["completion"] })}
        >
          <SelectTrigger className="w-[9.5rem]" aria-label="Outcome">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All outcomes</SelectItem>
            <SelectItem value="complete">Complete</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="none">No response</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.campaign} onValueChange={(v) => update({ campaign: v })}>
          <SelectTrigger className="w-[9.5rem]" aria-label="Campaign">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All campaigns</SelectItem>
            {campaigns.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="grid gap-1">
          <Label htmlFor="rf-from" className="text-xs text-muted-foreground">
            From
          </Label>
          <Input
            id="rf-from"
            type="date"
            value={filters.from}
            onChange={(e) => update({ from: e.target.value })}
            className="w-[9.5rem]"
          />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="rf-to" className="text-xs text-muted-foreground">
            To
          </Label>
          <Input
            id="rf-to"
            type="date"
            value={filters.to}
            onChange={(e) => update({ to: e.target.value })}
            className="w-[9.5rem]"
          />
        </div>
        <label className="flex h-9 items-center gap-2 text-sm">
          <Switch
            className="data-[state=checked]:bg-voice"
            checked={filters.requiredComplete}
            onCheckedChange={(v) => update({ requiredComplete: v })}
          />
          Required fields complete
        </label>
        {active ? (
          <Button variant="ghost" onClick={() => update(EMPTY_FILTERS)}>
            <X /> Clear
          </Button>
        ) : null}
        <div className="ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={!filtered.length}>
                <Download /> Export {filtered.length} rows
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => doExport("xlsx")}>
                <FileSpreadsheet /> Excel (.xlsx)
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => doExport("csv")}>
                <FileText /> CSV
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => doExport("xlsx", true)}>
                <FileSpreadsheet /> Excel with raw answers
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {filters.statuses.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {filters.statuses.map((s) => (
            <button
              key={s}
              type="button"
              className="inline-flex items-center gap-1 rounded-full border border-border bg-voice-soft px-2 py-0.5 text-xs"
              onClick={() => update({ statuses: filters.statuses.filter((x) => x !== s) })}
            >
              {s} <X className="size-3" aria-label={`Remove ${s}`} />
            </button>
          ))}
        </div>
      )}
      {!filtered.length ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
          <p className="font-semibold">No results match these filters</p>
          <Button variant="outline" className="mt-3" onClick={() => update(EMPTY_FILTERS)}>
            Clear filters
          </Button>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-xl border border-border bg-card shadow-sm md:block">
            <table className="w-max min-w-full text-sm">
              <thead className="bg-muted text-left text-xs font-semibold text-muted-foreground">
                <tr>
                  <th className="sticky left-0 z-10 min-w-[11rem] bg-muted px-3 py-2.5">Contact</th>
                  <th className="sticky left-[11rem] z-10 min-w-[8.5rem] bg-muted px-3 py-2.5">
                    Status
                  </th>
                  {fields.map((f) => (
                    <th key={f.id} className="min-w-[9rem] px-3 py-2.5">
                      {f.label}
                    </th>
                  ))}
                  <th className="min-w-[8rem] px-3 py-2.5">Outcome</th>
                  <th className="min-w-[8.5rem] px-3 py-2.5">Timestamp</th>
                  <th className="px-3 py-2.5 text-right">Duration</th>
                  <th className="px-3 py-2.5" aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {current.map((r) => {
                  const byKey = new Map(r.answers.map((a) => [a.fieldKey, a]));
                  return (
                    <tr
                      key={r.id}
                      className={cn(
                        "cursor-pointer border-t border-border hover:bg-voice-soft/60",
                        detail?.id === r.id && "bg-voice-soft",
                      )}
                      onClick={() => setDetail(r)}
                    >
                      <td className="sticky left-0 z-[1] min-w-[11rem] bg-card px-3 py-2.5">
                        <div className="flex items-center gap-1.5 font-semibold">
                          {r.contactName || "Unknown"} {r.source === "sample" && <SampleBadge />}
                        </div>
                        <div className="text-xs tabular-nums text-muted-foreground">{r.phone}</div>
                      </td>
                      <td className="sticky left-[11rem] z-[1] bg-card px-3 py-2.5">
                        <StatusBadge status={r.status} />
                      </td>
                      {fields.map((f) => (
                        <td
                          key={f.id}
                          className="max-w-[14rem] truncate px-3 py-2.5"
                          title={byKey.get(f.key)?.rawAnswer ?? ""}
                        >
                          {formatValue(byKey.get(f.key)?.normalizedAnswer) || (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      ))}
                      <td className="px-3 py-2.5 text-muted-foreground">
                        {COMPLETION_LABEL[completionOf(r, fields)]}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 tabular-nums">
                        {formatTimestamp(r.startedAt)}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">
                        {formatDuration(r.durationSeconds)}
                      </td>
                      <td className="px-2 py-1.5">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8"
                          aria-label="View call"
                          onClick={() => setDetail(r)}
                        >
                          <Eye />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Mobile cards */}
          <ul className="grid gap-2 md:hidden">
            {current.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  className="w-full rounded-xl border border-border bg-card p-3 text-left shadow-sm"
                  onClick={() => setDetail(r)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">
                      {r.contactName} {r.source === "sample" && <SampleBadge />}
                    </span>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="text-xs text-muted-foreground">{formatTimestamp(r.startedAt)}</p>
                  <dl className="mt-2 grid gap-0.5 text-sm">
                    {fields.slice(0, 3).map((f) => (
                      <div key={f.id} className="flex justify-between gap-2">
                        <dt className="text-muted-foreground">{f.label}</dt>
                        <dd className="truncate">
                          {formatValue(
                            r.answers.find((a) => a.fieldKey === f.key)?.normalizedAnswer,
                          ) || "—"}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <span className="mt-2 inline-block text-xs font-semibold text-voice">
                    View all
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Rows per page</span>
              <Select
                value={String(pageSize)}
                onValueChange={(v) => {
                  setPageSize(Number(v));
                  setPage(0);
                }}
              >
                <SelectTrigger className="h-8 w-[4.5rem]" aria-label="Rows per page">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[25, 50, 100].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 tabular-nums">
              <span className="text-muted-foreground">
                {page * pageSize + 1}–{Math.min(filtered.length, (page + 1) * pageSize)} of{" "}
                {filtered.length}
              </span>
              <Button
                size="icon"
                variant="outline"
                className="size-8"
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
                aria-label="Previous page"
              >
                <ChevronLeft />
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="size-8"
                disabled={page >= pageCount - 1}
                onClick={() => setPage(page + 1)}
                aria-label="Next page"
              >
                <ChevronRight />
              </Button>
            </div>
          </div>
        </>
      )}
      <ResultDetailSheet result={detail} fields={fields} onClose={() => setDetail(null)} />
    </div>
  );
}

function ResultDetailSheet({
  result,
  fields,
  onClose,
}: {
  result: CallResult | null;
  fields: DataField[];
  onClose: () => void;
}) {
  return (
    <Sheet open={Boolean(result)} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-xl"
      >
        {result && (
          <>
            <SheetHeader className="border-b border-border px-6 py-5">
              <SheetTitle className="flex items-center gap-2">
                {result.contactName || "Unknown contact"}{" "}
                {result.source === "sample" && <SampleBadge />}
              </SheetTitle>
              <SheetDescription className="tabular-nums">
                {result.phone} · {result.callId}
              </SheetDescription>
            </SheetHeader>
            <div className="grid flex-1 content-start gap-5 overflow-y-auto px-6 py-5 text-sm">
              <dl className="grid grid-cols-2 gap-3 rounded-xl border border-border p-3">
                <div>
                  <dt className="text-xs text-muted-foreground">Outcome</dt>
                  <dd className="mt-1">
                    <StatusBadge status={result.status} />
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Completion</dt>
                  <dd className="mt-1 font-medium">
                    {COMPLETION_LABEL[completionOf(result, fields)]}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Started</dt>
                  <dd className="mt-1 tabular-nums">{formatTimestamp(result.startedAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Duration</dt>
                  <dd className="mt-1 tabular-nums">{formatDuration(result.durationSeconds)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Campaign</dt>
                  <dd className="mt-1">{result.campaign || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Data source</dt>
                  <dd className="mt-1">{SOURCE_LABEL[result.source]}</dd>
                </div>
              </dl>
              <section>
                <h3 className="mb-2 font-semibold">Structured answers</h3>
                <table className="w-full overflow-hidden rounded-lg border border-border text-left">
                  <thead className="bg-muted/60 text-xs text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2">Field</th>
                      <th className="px-3 py-2">Normalized</th>
                      <th className="px-3 py-2">Raw answer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fields.map((f) => {
                      const a = result.answers.find((x) => x.fieldKey === f.key);
                      return (
                        <tr key={f.id} className="border-t border-border align-top">
                          <td className="px-3 py-2 font-medium">{f.label}</td>
                          <td className="px-3 py-2">
                            {formatValue(a?.normalizedAnswer) || (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">{a?.rawAnswer || "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </section>
              <section>
                <h3 className="mb-1 font-semibold">Call summary</h3>
                <p className="text-muted-foreground">{result.summary || "No summary."}</p>
              </section>
              <section>
                <h3 className="mb-1 font-semibold">Recording</h3>
                {result.recordingUrl ? (
                  <audio controls src={result.recordingUrl} className="w-full" />
                ) : (
                  <p className="text-muted-foreground">No recording for this call.</p>
                )}
              </section>
              <section>
                <h3 className="mb-1 font-semibold">Transcript</h3>
                <pre className="whitespace-pre-wrap rounded-lg bg-muted p-3 font-sans text-sm">
                  {result.transcript || "No transcript."}
                </pre>
              </section>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
