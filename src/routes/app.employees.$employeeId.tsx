import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ExternalLink, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { AnalyticsPanel } from "@/components/employees/analytics-panel";
import { DataCollectionTable } from "@/components/employees/data-collection-table";
import { ResultsView } from "@/components/employees/results-view";
import { StatusBadge } from "@/components/employees/status-badge";
import { StoreModeNote } from "@/components/employees/store-mode-note";
import { useRepository } from "@/components/employees/use-repository";
import { StepWorkflow, WorkflowDiagram } from "@/components/employees/wizard/step-build";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { computeAnalytics } from "@/lib/data-collection/analytics";
import { VERTICAL_TEMPLATES } from "@/lib/data-collection/catalog";
import { LANGUAGES, VOICE_PRESETS } from "@/lib/data-collection/draft";
import { validateFields, variableToken } from "@/lib/data-collection/fields";
import { buildSampleResults } from "@/lib/data-collection/seed";
import type { CallResult, DataField, EmployeeDraft } from "@/lib/data-collection/types";
import { workflowBuilderUrl } from "@/lib/data-collection/workflows";

const TABS = [
  ["overview", "Overview"],
  ["instructions", "Instructions"],
  ["knowledge", "Knowledge"],
  ["voice", "Voice & Language"],
  ["data", "Data Collection"],
  ["workflow", "Workflow"],
  ["results", "Results"],
  ["analytics", "Analytics"],
  ["outcomes", "Outcomes"],
] as const;

type TabId = (typeof TABS)[number][0];

const searchSchema = z.object({
  tab: z.enum(TABS.map((t) => t[0]) as [TabId, ...TabId[]]).optional(),
});

export const Route = createFileRoute("/app/employees/$employeeId")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({ meta: [{ title: "AI Employee · AstraConnect" }] }),
  component: EmployeeDetail,
});

function EmployeeDetail() {
  const { employeeId } = Route.useParams();
  const { tab = "overview" } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const repo = useRepository();
  const [employee, setEmployee] = useState<EmployeeDraft | null | undefined>(undefined);
  const [results, setResults] = useState<CallResult[]>([]);
  const [loadingResults, setLoadingResults] = useState(true);

  const reloadResults = useCallback(async () => {
    if (!repo) return;
    setLoadingResults(true);
    try {
      setResults(await repo.listResults(employeeId));
    } finally {
      setLoadingResults(false);
    }
  }, [repo, employeeId]);

  useEffect(() => {
    if (!repo) return;
    repo.getEmployee(employeeId).then(setEmployee, () => setEmployee(null));
    void reloadResults();
  }, [repo, employeeId, reloadResults]);

  const save = async (next: EmployeeDraft, msg = "Saved") => {
    if (!repo) return;
    try {
      setEmployee(await repo.saveEmployee(next));
      toast.success(msg);
    } catch (e) {
      toast.error("Couldn't save", { description: e instanceof Error ? e.message : undefined });
    }
  };

  if (employee === undefined)
    return (
      <div className="mx-auto max-w-[1200px] px-4 py-8 lg:px-8">
        <div className="h-8 w-60 animate-pulse rounded bg-muted" />
        <div className="mt-6 h-64 animate-pulse rounded-xl bg-muted" />
      </div>
    );

  if (employee === null)
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="font-semibold">Employee not found</p>
        <p className="text-sm text-muted-foreground">
          It may have been created in another browser or workspace.
        </p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/app/employees">Back to AI Employees</Link>
        </Button>
      </div>
    );

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 lg:px-8">
      <Link
        to="/app/employees"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> AI Employees
      </Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-full bg-voice-soft text-lg font-semibold text-voice">
            {employee.name.slice(0, 1).toUpperCase()}
          </span>
          <div>
            <h1 className="text-2xl font-semibold">{employee.name}</h1>
            <p className="text-sm text-muted-foreground">
              {employee.role} · {VERTICAL_TEMPLATES[employee.vertical]?.label ?? "Custom"}
            </p>
          </div>
          {employee.status === "published" ? (
            <StatusBadge status="Ready" />
          ) : (
            <span className="rounded-md border px-2 py-0.5 text-xs">Draft</span>
          )}
        </div>
        <StoreModeNote mode={repo?.mode ?? null} />
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => void navigate({ search: { tab: v as TabId }, replace: true })}
        className="mt-5"
      >
        <div className="-mx-4 overflow-x-auto px-4">
          <TabsList className="w-max">
            {TABS.map(([id, label]) => (
              <TabsTrigger key={id} value={id}>
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <TabsContent value="overview" className="mt-4">
          <OverviewTab employee={employee} results={results} />
        </TabsContent>
        <TabsContent value="instructions" className="mt-4">
          <InstructionsTab employee={employee} onSave={(e) => void save(e, "Instructions saved")} />
        </TabsContent>
        <TabsContent value="knowledge" className="mt-4">
          <ul className="grid gap-2 sm:grid-cols-2">
            {employee.knowledge.map((k) => (
              <li key={k.title} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <p className="font-semibold">{k.title}</p>
                <p className="text-sm text-muted-foreground">{k.description}</p>
                <p className="mt-2 text-xs text-muted-foreground">No documents attached yet.</p>
              </li>
            ))}
          </ul>
        </TabsContent>
        <TabsContent value="voice" className="mt-4">
          <VoiceTab employee={employee} onSave={(e) => void save(e, "Voice saved")} />
        </TabsContent>
        <TabsContent value="data" className="mt-4">
          <DataTab
            employee={employee}
            hasResults={results.some((r) => r.source !== "sample")}
            onSave={async (fields) => {
              if (!repo) return;
              await repo.saveFields(employee.id, fields);
              setEmployee({ ...employee, fields });
              toast.success("Data Collection saved");
            }}
          />
        </TabsContent>
        <TabsContent value="workflow" className="mt-4">
          <WorkflowTab employee={employee} onSave={(e) => void save(e, "Workflow saved")} />
        </TabsContent>
        <TabsContent value="results" className="mt-4">
          <ResultsView
            employeeName={employee.name}
            fields={employee.fields}
            results={results}
            loading={loadingResults}
            onLoadSample={async () => {
              if (!repo) return;
              await repo.addSampleResults(
                employee.id,
                buildSampleResults(employee.id, employee.fields),
              );
              await reloadResults();
              toast("Sample rows added", {
                description: "Clearly labelled as Sample. Not live calls.",
              });
            }}
            onClearSample={async () => {
              if (!repo) return;
              await repo.clearSampleResults(employee.id);
              await reloadResults();
            }}
          />
        </TabsContent>
        <TabsContent value="analytics" className="mt-4">
          <AnalyticsPanel fields={employee.fields} results={results} />
        </TabsContent>
        <TabsContent value="outcomes" className="mt-4">
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Outcome</th>
                  <th className="px-3 py-2">Meaning</th>
                  <th className="px-3 py-2">Then</th>
                </tr>
              </thead>
              <tbody>
                {employee.outcomes.map((o) => (
                  <tr key={o.status} className="border-t border-border">
                    <td className="px-3 py-2">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="px-3 py-2">{o.meaning}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {employee.workflow.statusActions[o.status] || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function OverviewTab({ employee, results }: { employee: EmployeeDraft; results: CallResult[] }) {
  const a = useMemo(() => computeAnalytics(employee.fields, results), [employee.fields, results]);
  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <h2 className="font-semibold">Objective</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {VERTICAL_TEMPLATES[employee.vertical]?.objective}
        </p>
        <h3 className="mt-4 text-sm font-semibold">What it was asked to do</h3>
        <p className="mt-1 text-sm text-muted-foreground">{employee.purpose}</p>
        {employee.researchMode === "neutral" && (
          <p className="mt-4 flex items-center gap-2 rounded-lg bg-voice-soft p-2 text-sm">
            <ShieldCheck className="size-4 text-voice" aria-hidden /> Neutral research mode: records
            opinions, never persuades.
          </p>
        )}
        <h3 className="mt-4 text-sm font-semibold">Data collected on every call</h3>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {employee.fields.map((f) => (
            <span
              key={f.id}
              className="rounded-full bg-voice-soft px-2 py-0.5 text-xs font-medium text-voice"
            >
              {f.label}
              {f.required ? " *" : ""}
            </span>
          ))}
        </div>
      </section>
      <section className="grid content-start gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
        <h2 className="font-semibold">Results so far</h2>
        {results.length === 0 ? (
          <p className="text-sm text-muted-foreground">No calls yet.</p>
        ) : (
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Calls{a.sampleOnly ? " (sample)" : ""}</dt>
              <dd className="text-xl font-semibold tabular-nums">{a.totalCalls}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Completion rate</dt>
              <dd className="text-xl font-semibold tabular-nums">{a.completionRate}%</dd>
            </div>
          </dl>
        )}
        <h3 className="text-sm font-semibold">Call flow</h3>
        <WorkflowDiagram steps={employee.workflowSteps} />
      </section>
    </div>
  );
}

function InstructionsTab({
  employee,
  onSave,
}: {
  employee: EmployeeDraft;
  onSave: (e: EmployeeDraft) => void;
}) {
  const [opening, setOpening] = useState(employee.openingLine);
  const [text, setText] = useState(employee.instructions);
  const dirty = opening !== employee.openingLine || text !== employee.instructions;
  return (
    <div className="grid gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="grid gap-1.5">
        <Label htmlFor="d-opening">Opening line</Label>
        <Textarea
          id="d-opening"
          rows={2}
          value={opening}
          onChange={(e) => setOpening(e.target.value)}
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="d-instr">Instructions</Label>
        <Textarea
          id="d-instr"
          rows={18}
          value={text}
          className="font-mono text-[13px]"
          onChange={(e) => setText(e.target.value)}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button
          variant="ghost"
          disabled={!dirty}
          onClick={() => (setOpening(employee.openingLine), setText(employee.instructions))}
        >
          Discard
        </Button>
        <Button
          className="bg-voice text-voice-foreground hover:bg-voice/90"
          disabled={!dirty || !opening.trim() || !text.trim()}
          onClick={() => onSave({ ...employee, openingLine: opening, instructions: text })}
        >
          Save changes
        </Button>
      </div>
    </div>
  );
}

function VoiceTab({
  employee,
  onSave,
}: {
  employee: EmployeeDraft;
  onSave: (e: EmployeeDraft) => void;
}) {
  return (
    <div className="grid max-w-xl gap-4 rounded-xl border border-border bg-card p-4 shadow-sm sm:grid-cols-2">
      <div className="grid gap-1.5">
        <Label>Voice</Label>
        <Select value={employee.voice} onValueChange={(v) => onSave({ ...employee, voice: v })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {VOICE_PRESETS.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                {v.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-1.5">
        <Label>Language</Label>
        <Select
          value={employee.language}
          onValueChange={(v) => onSave({ ...employee, language: v })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGES.map((l) => (
              <SelectItem key={l.id} value={l.id}>
                {l.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function DataTab({
  employee,
  hasResults,
  onSave,
}: {
  employee: EmployeeDraft;
  hasResults: boolean;
  onSave: (fields: DataField[]) => Promise<void>;
}) {
  const [fields, setFields] = useState(employee.fields);
  const issues = validateFields(fields);
  const dirty = JSON.stringify(fields) !== JSON.stringify(employee.fields);
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Every field is a structured column in Results and a variable in the Workflow Builder (e.g.{" "}
          <code className="font-mono text-xs">{variableToken(fields[0]?.key ?? "field_key")}</code>
          ).
        </p>
        <div className="flex gap-2">
          <Button variant="ghost" disabled={!dirty} onClick={() => setFields(employee.fields)}>
            Discard
          </Button>
          <Button
            className="bg-voice text-voice-foreground hover:bg-voice/90"
            disabled={!dirty || issues.length > 0}
            onClick={() => void onSave(fields)}
          >
            Save changes
          </Button>
        </div>
      </div>
      <DataCollectionTable
        fields={fields}
        onChange={setFields}
        issues={issues}
        hasResults={hasResults}
      />
    </div>
  );
}

function WorkflowTab({
  employee,
  onSave,
}: {
  employee: EmployeeDraft;
  onSave: (e: EmployeeDraft) => void;
}) {
  const [draft, setDraft] = useState(employee);
  const dirty = JSON.stringify(draft.workflow) !== JSON.stringify(employee.workflow);
  const builder = workflowBuilderUrl(employee.workflow.workflowId);
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="text-sm">
          <p className="font-semibold">Workflow Builder stays the place to design workflows.</p>
          <p className="text-muted-foreground">
            Here you only choose which workflow this employee uses and map outcomes.
          </p>
        </div>
        {builder && (
          <Button variant="outline" asChild>
            <a href={builder} target="_blank" rel="noreferrer">
              Open Workflow Builder <ExternalLink />
            </a>
          </Button>
        )}
      </div>
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <StepWorkflow
          draft={draft}
          update={(p) => setDraft((d) => ({ ...d, ...p }))}
          showErrors={false}
        />
        <div className="mt-4 flex justify-end">
          <Button
            className="bg-voice text-voice-foreground hover:bg-voice/90"
            disabled={!dirty || (draft.workflow.mode === "existing" && !draft.workflow.workflowId)}
            onClick={() => onSave({ ...employee, workflow: draft.workflow })}
          >
            Save workflow
          </Button>
        </div>
      </div>
    </div>
  );
}
