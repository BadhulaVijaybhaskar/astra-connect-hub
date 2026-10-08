import { AlertCircle, CheckCircle2, ExternalLink } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { VERTICAL_TEMPLATES } from "@/lib/data-collection/catalog";
import { LANGUAGES, VOICE_PRESETS } from "@/lib/data-collection/draft";
import type { EmployeeDraft } from "@/lib/data-collection/types";
import { stepIssues, type WizardStepId } from "@/lib/data-collection/wizard";
import { WORKFLOW_TEMPLATES, workflowBuilderUrl } from "@/lib/data-collection/workflows";
import { cn } from "@/lib/utils";
import { WorkflowDiagram } from "./step-build";

function SummaryCard({
  title,
  step,
  draft,
  onEdit,
  children,
}: {
  title: string;
  step: WizardStepId;
  draft: EmployeeDraft;
  onEdit: (step: WizardStepId) => void;
  children: ReactNode;
}) {
  const issues = stepIssues(step, draft);
  const bad = issues.length > 0;
  return (
    <section
      className={cn(
        "rounded-xl border border-border bg-card p-4 shadow-sm",
        bad && "border-destructive",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 font-semibold">
          {bad ? (
            <AlertCircle className="size-4 text-destructive" aria-hidden />
          ) : (
            <CheckCircle2 className="size-4 text-success" aria-hidden />
          )}
          {title}
        </h3>
        <Button
          variant="link"
          size="sm"
          className={cn("h-auto p-0 text-voice", bad && "text-destructive")}
          onClick={() => onEdit(step)}
        >
          {bad ? "Fix" : "Edit"}
        </Button>
      </div>
      <div className="mt-2 grid gap-1 text-sm">{children}</div>
      {bad && <p className="mt-2 text-xs text-destructive">{issues[0]}</p>}
    </section>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex gap-2">
      <span className="w-28 shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0">{children}</span>
    </div>
  );
}

export function ReviewSummary({
  draft,
  onEdit,
}: {
  draft: EmployeeDraft;
  onEdit: (step: WizardStepId) => void;
}) {
  const t = VERTICAL_TEMPLATES[draft.vertical];
  const answered = draft.setupAnswers.filter((a) => !a.skipped && a.value !== null).length;
  const required = draft.fields.filter((f) => f.required).length;
  const builder = workflowBuilderUrl(draft.workflow.workflowId);
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <SummaryCard title="Identity" step="identity" draft={draft} onEdit={onEdit}>
        <Fact label="Employee">{draft.name || "—"}</Fact>
        <Fact label="Role">{draft.role || "—"}</Fact>
        <Fact label="Voice">
          {VOICE_PRESETS.find((v) => v.id === draft.voice)?.label ?? draft.voice} ·{" "}
          {LANGUAGES.find((l) => l.id === draft.language)?.label ?? draft.language}
        </Fact>
        <Fact label="Brand">{draft.brand || "—"}</Fact>
      </SummaryCard>
      <SummaryCard title="Purpose" step="purpose" draft={draft} onEdit={onEdit}>
        <Fact label="Use case">{t.label}</Fact>
        <Fact label="Objective">{t.objective}</Fact>
        <Fact label="Direction">
          <span className="capitalize">{draft.direction}</span>
        </Fact>
        <Fact label="Success">{draft.successOutcome}</Fact>
        {draft.researchMode === "neutral" && <Fact label="Mode">Neutral research mode</Fact>}
      </SummaryCard>
      <SummaryCard title="AI setup" step="questions" draft={draft} onEdit={onEdit}>
        <Fact label="Answered">
          {answered} of {draft.setupQuestions.length} questions
        </Fact>
        <Fact label="Knowledge">{draft.knowledge.map((k) => k.title).join(", ") || "—"}</Fact>
      </SummaryCard>
      <SummaryCard title="Data to collect" step="data" draft={draft} onEdit={onEdit}>
        <Fact label="Fields">
          {draft.fields.length} fields · {required} required ·{" "}
          {draft.fields.filter((f) => f.condition).length} follow-ups
        </Fact>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {draft.fields.slice(0, 5).map((f) => (
            <span
              key={f.id}
              className="rounded-full bg-voice-soft px-2 py-0.5 text-xs font-medium text-voice"
            >
              {f.label}
            </span>
          ))}
          {draft.fields.length > 5 && (
            <span className="text-xs text-muted-foreground">+{draft.fields.length - 5} more</span>
          )}
        </div>
      </SummaryCard>
      <SummaryCard title="Instructions" step="instructions" draft={draft} onEdit={onEdit}>
        <p className="line-clamp-3 italic text-muted-foreground">
          “{draft.openingLine || "No opening line"}”
        </p>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="link" size="sm" className="h-auto w-fit p-0 text-voice">
              View full
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85svh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Instructions</DialogTitle>
              <DialogDescription>
                Tone: {draft.tone}. Guardrails: {draft.guardrails.join(", ") || "none"}.
              </DialogDescription>
            </DialogHeader>
            <pre className="whitespace-pre-wrap rounded-lg bg-muted p-3 font-sans text-sm">
              {draft.instructions}
            </pre>
          </DialogContent>
        </Dialog>
      </SummaryCard>
      <SummaryCard title="Workflow" step="workflow" draft={draft} onEdit={onEdit}>
        <Fact label="Attachment">
          {draft.workflow.mode === "none"
            ? "No workflow"
            : draft.workflow.mode === "existing"
              ? (draft.workflow.workflowName ?? "—")
              : `Template: ${WORKFLOW_TEMPLATES.find((w) => w.key === draft.workflow.templateKey)?.name ?? "—"}`}
        </Fact>
        {draft.workflow.mode === "existing" && builder && (
          <a
            href={builder}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-fit items-center gap-1 text-xs font-semibold text-voice"
          >
            Open in Workflow Builder <ExternalLink className="size-3" />
          </a>
        )}
        <div className="mt-2">
          <WorkflowDiagram steps={draft.workflowSteps} />
        </div>
      </SummaryCard>
    </div>
  );
}
