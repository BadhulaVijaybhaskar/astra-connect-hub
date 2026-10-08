import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, Check, CheckCircle2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { blankDraft } from "@/lib/data-collection/draft";
import {
  defaultAnswers,
  getSetupGenerator,
  type SetupContext,
} from "@/lib/data-collection/setup-engine";
import { clearWizardDraft, loadWizardDraft, saveWizardDraft } from "@/lib/data-collection/store";
import type { EmployeeDraft } from "@/lib/data-collection/types";
import { WIZARD_STEPS, stepIssues, type WizardStepId } from "@/lib/data-collection/wizard";
import { cn } from "@/lib/utils";
import { StoreModeNote } from "../store-mode-note";
import { useRepository } from "../use-repository";
import { ReviewSummary } from "./review-summary";
import { StepData, StepInstructions, StepWorkflow } from "./step-build";
import { StepIdentity, StepPurpose } from "./step-identity-purpose";
import { StepAiQuestions } from "./step-questions";

const LAST = WIZARD_STEPS.length - 1;

function ctxOf(d: EmployeeDraft): SetupContext {
  return {
    name: d.name,
    role: d.role,
    brand: d.brand,
    purpose: d.purpose,
    goal: d.goal,
    direction: d.direction,
    vertical: d.vertical,
  };
}

function relative(ts: number | null, now: number): string {
  if (!ts) return "";
  const s = Math.round((now - ts) / 1000);
  if (s < 10) return "Saved · just now";
  if (s < 60) return `Saved · ${s}s ago`;
  return `Saved · ${Math.round(s / 60)}m ago`;
}

export function CreateEmployeeWizard() {
  const reduce = useReducedMotion();
  const repo = useRepository();
  const generator = useMemo(() => getSetupGenerator(), []);
  const [draft, setDraft] = useState<EmployeeDraft>(() => blankDraft("Astra Voice"));
  const [step, setStep] = useState(0);
  const [furthest, setFurthest] = useState(0);
  const [showErrors, setShowErrors] = useState(false);
  const [returnToReview, setReturnToReview] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [dirty, setDirty] = useState(false);
  const [loadingQs, setLoadingQs] = useState(false);
  const [qError, setQError] = useState<string | null>(null);
  const [existingNames, setExistingNames] = useState<string[]>([]);
  const [created, setCreated] = useState<EmployeeDraft | null>(null);
  const [busy, setBusy] = useState(false);
  const generatedFor = useRef<{ questions: string; setup: string }>({ questions: "", setup: "" });
  const panelRef = useRef<HTMLDivElement>(null);

  const stepId = WIZARD_STEPS[step]?.id ?? "identity";

  // Restore a saved draft once on the client.
  useEffect(() => {
    const saved = loadWizardDraft();
    if (saved?.draft) {
      setDraft(saved.draft);
      setStep(saved.step);
      setFurthest(saved.step);
      setSavedAt(saved.savedAt);
      generatedFor.current = {
        questions: `${saved.draft.vertical}|${saved.draft.direction}`,
        setup: saved.draft.fields.length ? JSON.stringify(saved.draft.setupAnswers) : "",
      };
      toast("Draft restored", { description: "Continuing where you left off." });
    }
  }, []);

  useEffect(() => {
    if (!repo) return;
    void repo
      .listEmployees()
      .then((list) => setExistingNames(list.map((e) => e.name.trim().toLowerCase())));
  }, [repo]);

  const persist = useCallback((d: EmployeeDraft, s: number) => {
    saveWizardDraft(d, s);
    setSavedAt(Date.now());
    setDirty(false);
  }, []);

  // Autosave every 10s while dirty; tick the "Saved · …" label.
  useEffect(() => {
    const id = window.setInterval(() => {
      setNow(Date.now());
      if (dirty && !created) persist(draft, step);
    }, 10_000);
    return () => window.clearInterval(id);
  }, [dirty, draft, step, persist, created]);

  const update = useCallback((patch: Partial<EmployeeDraft>) => {
    setDraft((d) => ({ ...d, ...patch, updatedAt: new Date().toISOString() }));
    setDirty(true);
  }, []);

  const generateQuestions = useCallback(
    async (d: EmployeeDraft) => {
      setLoadingQs(true);
      setQError(null);
      try {
        const questions = await generator.questions(ctxOf(d));
        const defaults = defaultAnswers(ctxOf(d));
        const prefill = defaults.filter((a) =>
          ["collect", "mandatory", "followups"].includes(a.questionId),
        );
        update({ setupQuestions: questions, setupAnswers: prefill });
        generatedFor.current.questions = `${d.vertical}|${d.direction}`;
        generatedFor.current.setup = "";
      } catch (e) {
        setQError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setLoadingQs(false);
      }
    },
    [generator, update],
  );

  const generateSetup = useCallback(
    async (d: EmployeeDraft, opts: { fieldsOnly?: boolean } = {}) => {
      const g = await generator.generate(ctxOf(d), d.setupAnswers);
      if (opts.fieldsOnly) {
        update({ fields: g.fields });
        return;
      }
      update({
        fields: g.fields,
        openingLine: g.openingLine,
        instructions: g.instructions,
        knowledge: g.knowledge,
        workflowSteps: g.workflowSteps,
        outcomes: g.outcomes,
        researchMode: g.researchMode,
        workflow: { ...d.workflow, statusActions: g.statusActions },
      });
      generatedFor.current.setup = JSON.stringify(d.setupAnswers);
    },
    [generator, update],
  );

  const goTo = (i: number) => {
    setShowErrors(false);
    setStep(i);
    setFurthest((f) => Math.max(f, i));
    panelRef.current?.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
  };

  const canVisit = (i: number) => {
    if (i <= step) return true;
    if (i > furthest + 1) return false;
    for (let k = 0; k < i; k++) {
      const id = WIZARD_STEPS[k]?.id;
      if (id && id !== "review" && stepIssues(id, draft).length) return false;
    }
    return true;
  };

  const onContinue = async () => {
    const issues = stepIssues(stepId, draft);
    if (issues.length) {
      setShowErrors(true);
      toast.error(issues[0] ?? "Please complete this step");
      return;
    }
    let next = step + 1;
    if (stepId === "purpose") {
      const key = `${draft.vertical}|${draft.direction}`;
      if (!draft.setupQuestions.length || generatedFor.current.questions !== key)
        void generateQuestions(draft);
    }
    if (stepId === "questions") {
      const key = JSON.stringify(draft.setupAnswers);
      if (generatedFor.current.setup !== key) {
        await generateSetup(draft);
        if (furthest > step)
          toast("Fields, instructions and workflow were regenerated from your answers.");
      }
    }
    if (returnToReview) {
      next = LAST;
      setReturnToReview(false);
    }
    persist(draft, next);
    goTo(next);
  };

  const onEditFromReview = (id: WizardStepId) => {
    setReturnToReview(true);
    goTo(WIZARD_STEPS.findIndex((s) => s.id === id));
  };

  const saveDraft = async () => {
    persist(draft, step);
    if (repo && !stepIssues("identity", draft).length) {
      try {
        await repo.saveEmployee({ ...draft, status: "draft" });
        toast.success("Draft saved", {
          description:
            repo.mode === "local" ? "Saved in this browser." : "Saved to your workspace.",
        });
      } catch (e) {
        toast.error("Couldn't save draft", {
          description: e instanceof Error ? e.message : undefined,
        });
      }
    } else toast.success("Draft saved in this browser");
  };

  const create = async () => {
    if (!repo) return;
    setBusy(true);
    try {
      const saved = await repo.saveEmployee({ ...draft, status: "published" });
      clearWizardDraft();
      setCreated(saved);
    } catch (e) {
      toast.error("Couldn't create the employee", {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  };

  const startOver = () => {
    clearWizardDraft();
    setDraft(blankDraft("Astra Voice"));
    setStep(0);
    setFurthest(0);
    setSavedAt(null);
    generatedFor.current = { questions: "", setup: "" };
  };

  const blockers = stepIssues("review", draft);

  if (created)
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <div className="rounded-xl border border-border bg-card p-6 text-center shadow-sm">
          <CheckCircle2 className="mx-auto size-10 text-success" aria-hidden />
          <h1 className="mt-3 text-xl font-semibold">{created.name} is created · Ready</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {created.fields.length} fields will be collected on every call. Calls start once
            contacts or a phone number are assigned.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button asChild className="bg-voice text-voice-foreground hover:bg-voice/90">
              <Link to="/app/employees/$employeeId" params={{ employeeId: created.id }}>
                View employee
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link
                to="/app/employees/$employeeId"
                params={{ employeeId: created.id }}
                search={{ tab: "results" }}
              >
                Open Results
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );

  const meta = WIZARD_STEPS[step];
  const stateOf = (i: number) => {
    const id = WIZARD_STEPS[i]?.id;
    if (i === step) return "active";
    if (i > furthest) return "upcoming";
    if (id && id !== "review" && stepIssues(id, draft).length) return "error";
    return i < step || i <= furthest ? "complete" : "upcoming";
  };

  return (
    <TooltipProvider delayDuration={150}>
      <div className="mx-auto w-full max-w-[1200px] px-4 pb-28 pt-6 lg:px-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
          <div>
            <Link
              to="/app/employees"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-4" /> AI Employees
            </Link>
            <h1 className="mt-1 text-2xl font-semibold">Create AI Employee</h1>
          </div>
          <div className="flex items-center gap-3">
            <StoreModeNote mode={repo?.mode ?? null} />
            <Button variant="ghost" size="sm" onClick={startOver}>
              Start over
            </Button>
          </div>
        </div>

        {/* Mobile / tablet step chips */}
        <div className="-mx-4 mb-4 overflow-x-auto px-4 lg:hidden">
          <div className="flex w-max gap-2">
            {WIZARD_STEPS.map((s, i) => {
              const st = stateOf(i);
              return (
                <button
                  key={s.id}
                  type="button"
                  disabled={!canVisit(i)}
                  onClick={() => goTo(i)}
                  ref={(el) => {
                    if (el && i === step) el.scrollIntoView({ inline: "center", block: "nearest" });
                  }}
                  className={cn(
                    "whitespace-nowrap rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground disabled:opacity-50",
                    st === "active" && "border-voice bg-voice-soft text-voice",
                    st === "error" && "border-destructive text-destructive",
                  )}
                >
                  {i === step
                    ? `${i + 1}/${WIZARD_STEPS.length} · ${s.label}`
                    : `${i + 1}. ${s.label}`}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Desktop timeline */}
          <nav aria-label="Create employee steps" className="hidden lg:block">
            <ol className="sticky top-6 grid gap-1">
              {WIZARD_STEPS.map((s, i) => {
                const st = stateOf(i);
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      disabled={!canVisit(i)}
                      onClick={() => goTo(i)}
                      aria-current={st === "active" ? "step" : undefined}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors disabled:cursor-not-allowed",
                        st === "active" ? "bg-voice-soft" : "hover:bg-muted",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border text-xs font-semibold tabular-nums",
                          st === "active" && "border-voice bg-voice text-voice-foreground",
                          st === "complete" && "border-voice/40 bg-card text-voice",
                          st === "error" && "border-destructive bg-destructive/10 text-destructive",
                          st === "upcoming" && "border-border bg-card text-muted-foreground",
                        )}
                      >
                        {st === "complete" ? <Check className="size-3.5" /> : i + 1}
                      </span>
                      <span>
                        <span
                          className={cn(
                            "block text-sm font-semibold",
                            st === "upcoming" && "text-muted-foreground",
                          )}
                        >
                          {s.label}
                        </span>
                        <span className="block text-xs text-muted-foreground">{s.hint}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>

          <div ref={panelRef} className="min-w-0 scroll-mt-6">
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={stepId}
                  initial={reduce ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? { opacity: 1 } : { opacity: 0, y: -8 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                >
                  <header className="mb-5">
                    <p className="text-xs font-semibold text-muted-foreground">
                      Step {step + 1} of {WIZARD_STEPS.length}
                    </p>
                    <h2 className="text-xl font-semibold">{meta?.label}</h2>
                    <p className="text-sm text-muted-foreground">{meta?.hint}</p>
                  </header>
                  {stepId === "identity" && (
                    <StepIdentity
                      draft={draft}
                      update={update}
                      showErrors={showErrors}
                      duplicateName={
                        Boolean(draft.name.trim()) &&
                        existingNames.includes(draft.name.trim().toLowerCase())
                      }
                    />
                  )}
                  {stepId === "purpose" && (
                    <StepPurpose draft={draft} update={update} showErrors={showErrors} />
                  )}
                  {stepId === "questions" && (
                    <StepAiQuestions
                      draft={draft}
                      update={update}
                      showErrors={showErrors}
                      loading={loadingQs}
                      error={qError}
                      onRegenerate={() => void generateQuestions(draft)}
                      onUseDefaults={() => update({ setupAnswers: defaultAnswers(ctxOf(draft)) })}
                    />
                  )}
                  {stepId === "data" && (
                    <StepData
                      draft={draft}
                      update={update}
                      showErrors={showErrors}
                      onUseSuggested={() => void generateSetup(draft, { fieldsOnly: true })}
                    />
                  )}
                  {stepId === "instructions" && (
                    <StepInstructions draft={draft} update={update} showErrors={showErrors} />
                  )}
                  {stepId === "workflow" && (
                    <StepWorkflow draft={draft} update={update} showErrors={showErrors} />
                  )}
                  {stepId === "review" && <ReviewSummary draft={draft} onEdit={onEditFromReview} />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky footer */}
      <footer className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1200px] items-center gap-2 px-4 py-3 lg:px-8">
          <Button
            variant="ghost"
            onClick={() => goTo(Math.max(0, step - 1))}
            disabled={step === 0}
            aria-label="Back"
          >
            <ArrowLeft /> <span className="hidden sm:inline">Back</span>
          </Button>
          <span className="hidden text-xs text-muted-foreground sm:inline">
            {relative(savedAt, now)}
          </span>
          <div className="ml-auto flex flex-1 items-center justify-end gap-2 sm:flex-none">
            <Button
              variant="outline"
              onClick={() => void saveDraft()}
              className="hidden sm:inline-flex"
            >
              Save draft
            </Button>
            {stepId === "review" ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex-1 sm:flex-none" tabIndex={blockers.length ? 0 : -1}>
                    <Button
                      className="w-full bg-voice text-voice-foreground hover:bg-voice/90"
                      disabled={blockers.length > 0 || busy || !repo}
                      onClick={() => void create()}
                    >
                      Create &amp; publish employee
                    </Button>
                  </span>
                </TooltipTrigger>
                {blockers.length > 0 && (
                  <TooltipContent className="max-w-xs">
                    <ul className="list-disc pl-4">
                      {blockers.slice(0, 5).map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                  </TooltipContent>
                )}
              </Tooltip>
            ) : (
              <Button
                className="flex-1 bg-voice text-voice-foreground hover:bg-voice/90 sm:flex-none"
                onClick={() => void onContinue()}
              >
                {stepId === "purpose"
                  ? "Generate setup"
                  : returnToReview
                    ? "Back to review"
                    : "Continue"}
              </Button>
            )}
          </div>
        </div>
      </footer>
    </TooltipProvider>
  );
}
