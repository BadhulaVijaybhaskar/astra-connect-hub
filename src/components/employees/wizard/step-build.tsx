import { ArrowDown, Copy, ExternalLink, Plus, RefreshCw, ShieldCheck, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { validateFields, variableToken } from "@/lib/data-collection/fields";
import { missingFieldMentions } from "@/lib/data-collection/setup-engine";
import {
  CALL_STATUSES,
  type CallStatus,
  type DataField,
  type WorkflowMode,
  type WorkflowStep,
} from "@/lib/data-collection/types";
import { INSTRUCTIONS_LIMIT } from "@/lib/data-collection/wizard";
import {
  WORKFLOW_TEMPLATES,
  listWorkflows,
  workflowBuilderUrl,
  type WorkflowListResult,
} from "@/lib/data-collection/workflows";
import { cn } from "@/lib/utils";
import { DataCollectionTable } from "../data-collection-table";
import type { StepProps } from "./step-identity-purpose";

export function StepData({
  draft,
  update,
  onUseSuggested,
}: StepProps & { onUseSuggested: () => void }) {
  return (
    <div className="grid gap-3">
      <p className="text-sm text-muted-foreground">
        Each field is asked on the call, saved as raw + normalized answer, shown as a Results
        column, and available to the Workflow Builder as a variable.
      </p>
      <DataCollectionTable
        fields={draft.fields}
        onChange={(fields) => update({ fields })}
        issues={validateFields(draft.fields)}
        onUseSuggested={onUseSuggested}
      />
    </div>
  );
}

const TONES = ["Friendly", "Professional", "Concise"];
const GUARDRAILS = [
  "Don't promise pricing",
  "Transfer on request",
  "Respect DND",
  "No medical or legal advice",
];

export function StepInstructions({ draft, update, showErrors }: StepProps) {
  const missing = missingFieldMentions(draft.instructions, draft.fields);
  const insert = (f: DataField) =>
    update({
      instructions: `${draft.instructions.trimEnd()}\n- ${f.label} (required): "${f.prompt}" Save to ${f.key}.`,
    });
  return (
    <div className="grid gap-5">
      {draft.researchMode === "neutral" && (
        <div className="flex gap-3 rounded-xl border border-voice/30 bg-voice-soft p-3 text-sm">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-voice" aria-hidden />
          <p>
            <strong>Neutral research mode is on.</strong> The employee records opinions without
            persuading anyone. Undecided and Prefer not to answer are always accepted, and a refused
            question is saved as “Prefer not to answer”.
          </p>
        </div>
      )}
      <div className="grid gap-1.5">
        <Label htmlFor="emp-opening">Opening line *</Label>
        <Textarea
          id="emp-opening"
          rows={2}
          value={draft.openingLine}
          onChange={(e) => update({ openingLine: e.target.value })}
        />
        {showErrors && !draft.openingLine.trim() && (
          <p className="text-xs text-destructive">Opening line is required</p>
        )}
      </div>
      <div className="grid gap-1.5">
        <div className="flex items-baseline justify-between">
          <Label htmlFor="emp-instructions">Instructions *</Label>
          <span
            className={cn(
              "text-xs tabular-nums text-muted-foreground",
              draft.instructions.length > INSTRUCTIONS_LIMIT && "text-destructive",
            )}
          >
            {draft.instructions.length}/{INSTRUCTIONS_LIMIT}
          </span>
        </div>
        <Textarea
          id="emp-instructions"
          rows={16}
          value={draft.instructions}
          className="font-mono text-[13px] leading-relaxed"
          onChange={(e) => update({ instructions: e.target.value })}
        />
        {showErrors && !draft.instructions.trim() && (
          <p className="text-xs text-destructive">Instructions are required</p>
        )}
        {missing.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {missing.map((f) => (
              <span
                key={f.id}
                className="inline-flex items-center gap-1 rounded-full border border-warning/40 bg-warning/10 px-2 py-0.5 text-xs"
              >
                {f.label} not asked yet
                <button
                  type="button"
                  className="font-semibold text-voice"
                  onClick={() => insert(f)}
                >
                  Insert
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="grid gap-1.5">
        <Label>Tone</Label>
        <div className="flex flex-wrap gap-2">
          {TONES.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={draft.tone === t}
              onClick={() => update({ tone: t })}
              className={cn(
                "rounded-full border border-border px-3 py-1.5 text-sm",
                draft.tone === t && "border-voice bg-voice-soft text-voice",
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-1.5">
        <Label>Guardrails</Label>
        <div className="grid gap-1.5 sm:grid-cols-2">
          {GUARDRAILS.map((g) => (
            <label key={g} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-4 accent-[var(--voice)]"
                checked={draft.guardrails.includes(g)}
                onChange={(e) =>
                  update({
                    guardrails: e.target.checked
                      ? [...draft.guardrails, g]
                      : draft.guardrails.filter((x) => x !== g),
                  })
                }
              />
              {g}
            </label>
          ))}
        </div>
      </div>
      <KnowledgeEditor draft={draft} update={update} showErrors={showErrors} />
    </div>
  );
}

function KnowledgeEditor({ draft, update }: StepProps) {
  const [title, setTitle] = useState("");
  return (
    <div className="grid gap-1.5">
      <Label>Knowledge structure</Label>
      <p className="text-xs text-muted-foreground">
        Sections the employee can rely on. Attach documents to them after creation.
      </p>
      <ul className="grid gap-1.5">
        {draft.knowledge.map((k, i) => (
          <li
            key={`${k.title}-${i}`}
            className="flex items-start justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm"
          >
            <div>
              <p className="font-medium">{k.title}</p>
              <p className="text-xs text-muted-foreground">{k.description}</p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="size-7"
              aria-label={`Remove ${k.title}`}
              onClick={() => update({ knowledge: draft.knowledge.filter((_, j) => j !== i) })}
            >
              <X />
            </Button>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <Input
          value={title}
          placeholder="Add a section, e.g. Price list"
          onChange={(e) => setTitle(e.target.value)}
        />
        <Button
          variant="outline"
          onClick={() => {
            if (!title.trim()) return;
            update({
              knowledge: [...draft.knowledge, { title: title.trim(), description: "Added by you" }],
            });
            setTitle("");
          }}
        >
          <Plus /> Add
        </Button>
      </div>
    </div>
  );
}

export function WorkflowDiagram({ steps }: { steps: WorkflowStep[] }) {
  return (
    <ol className="grid justify-items-start gap-1">
      {steps.map((s, i) => (
        <li key={s.id} className="grid justify-items-start gap-1">
          <div className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm shadow-sm">
            <span className="font-medium">{s.label}</span>
            <span className="ml-2 text-xs text-muted-foreground">{s.detail}</span>
          </div>
          {i < steps.length - 1 && (
            <ArrowDown className="ml-4 size-3.5 text-muted-foreground" aria-hidden />
          )}
        </li>
      ))}
    </ol>
  );
}

const MODES: { id: WorkflowMode; label: string; hint: string }[] = [
  { id: "none", label: "No workflow", hint: "Just collect data. Add a workflow any time." },
  {
    id: "existing",
    label: "Attach existing workflow",
    hint: "Use a workflow already built in the Workflow Builder.",
  },
  {
    id: "template",
    label: "Start from template",
    hint: "Hand a starting point to the Workflow Builder.",
  },
];

export function StepWorkflow({ draft, update }: StepProps) {
  const [list, setList] = useState<WorkflowListResult | null>(null);
  const builder = workflowBuilderUrl(draft.workflow.workflowId);
  const refresh = useCallback(() => {
    setList(null);
    void listWorkflows().then(setList);
  }, []);
  useEffect(() => {
    refresh();
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);
  const setWf = (patch: Partial<typeof draft.workflow>) =>
    update({ workflow: { ...draft.workflow, ...patch } });
  const outcomeStatuses = [
    ...new Set<CallStatus>([draft.successOutcome, "Callback", "Not interested", "No answer"]),
  ].filter((s) => (CALL_STATUSES as readonly string[]).includes(s));

  return (
    <div className="grid gap-5">
      <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Workflow">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={draft.workflow.mode === m.id}
            onClick={() => setWf({ mode: m.id })}
            className={cn(
              "rounded-xl border border-border bg-card p-3 text-left shadow-sm transition-colors hover:border-voice/40",
              draft.workflow.mode === m.id && "border-voice bg-voice-soft",
            )}
          >
            <p className="text-sm font-semibold">{m.label}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{m.hint}</p>
          </button>
        ))}
      </div>

      {draft.workflow.mode === "existing" && (
        <div className="rounded-xl border border-border bg-card shadow-sm">
          {list === null ? (
            <div className="grid gap-2 p-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-9 animate-pulse rounded-md bg-muted" />
              ))}
            </div>
          ) : list.state === "error" ? (
            <div className="p-4 text-sm">
              <p className="font-semibold">Workflow unavailable</p>
              <p className="text-muted-foreground">{list.message}</p>
              <Button size="sm" variant="outline" className="mt-2" onClick={refresh}>
                <RefreshCw /> Refresh list
              </Button>
            </div>
          ) : list.workflows.length === 0 ? (
            <div className="p-4 text-sm">
              <p className="font-semibold">No workflows yet</p>
              <p className="text-muted-foreground">
                {list.state === "unconfigured"
                  ? "The voice platform connection is not configured for this workspace, so no workflows can be listed."
                  : "Build one in the Workflow Builder, then come back. This list refreshes automatically."}
              </p>
              <Button
                size="sm"
                variant="ghost"
                className="mt-2"
                onClick={() => setWf({ mode: "none" })}
              >
                Continue without workflow
              </Button>
            </div>
          ) : (
            <Command>
              <CommandInput placeholder="Search workflows" />
              <CommandList>
                <CommandEmpty>No workflow matches.</CommandEmpty>
                {list.workflows.map((w) => (
                  <CommandItem
                    key={w.id}
                    value={`${w.name} ${w.id}`}
                    onSelect={() => setWf({ workflowId: w.id, workflowName: w.name })}
                    className={cn(draft.workflow.workflowId === w.id && "bg-voice-soft")}
                  >
                    <div className="flex w-full items-center justify-between gap-2">
                      <span className="font-medium">{w.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {w.direction} · {w.status}
                        {w.updatedAt
                          ? ` · edited ${new Date(w.updatedAt).toLocaleDateString("en-IN")}`
                          : ""}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandList>
            </Command>
          )}
        </div>
      )}

      {draft.workflow.mode === "template" && (
        <div className="grid gap-2 sm:grid-cols-2">
          {WORKFLOW_TEMPLATES.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setWf({ templateKey: t.key })}
              aria-pressed={draft.workflow.templateKey === t.key}
              className={cn(
                "rounded-xl border border-border bg-card p-3 text-left text-sm shadow-sm hover:border-voice/40",
                draft.workflow.templateKey === t.key && "border-voice bg-voice-soft",
              )}
            >
              <p className="font-semibold">{t.name}</p>
              <p className="text-xs text-muted-foreground">{t.description}</p>
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="grid content-start gap-2">
          <h3 className="text-sm font-semibold">Suggested call flow</h3>
          <WorkflowDiagram steps={draft.workflowSteps} />
        </section>
        <section className="grid content-start gap-3">
          <div>
            <h3 className="text-sm font-semibold">After each call</h3>
            <div className="mt-2 grid gap-2">
              {outcomeStatuses.map((s) => (
                <label key={s} className="grid grid-cols-[7.5rem_1fr] items-center gap-2 text-sm">
                  <span className="text-muted-foreground">{s} →</span>
                  <Input
                    value={draft.workflow.statusActions[s] ?? ""}
                    placeholder="e.g. Send to CRM"
                    onChange={(e) =>
                      setWf({
                        statusActions: { ...draft.workflow.statusActions, [s]: e.target.value },
                      })
                    }
                  />
                </label>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold">Variables for the Workflow Builder</h3>
            <p className="text-xs text-muted-foreground">
              Data Collection fields become variables your workflow nodes can use.
            </p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {draft.fields.map((f) => (
                <li key={f.id}>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-muted px-2 py-0.5 font-mono text-xs"
                    onClick={() => {
                      void navigator.clipboard?.writeText(variableToken(f.key));
                      toast("Copied", { description: variableToken(f.key), duration: 1500 });
                    }}
                    title="Copy"
                  >
                    {variableToken(f.key)} <Copy className="size-3" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          </div>
          {builder ? (
            <Button variant="outline" asChild className="w-fit">
              <a href={builder} target="_blank" rel="noreferrer">
                Open Workflow Builder <ExternalLink />
              </a>
            </Button>
          ) : (
            <p className="text-xs text-muted-foreground">
              Open Workflow Builder becomes available once the Workflow Builder link is configured
              for this workspace.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
