import type { ReactNode } from "react";
import { Check, RefreshCw, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SetupAnswer, SetupQuestion } from "@/lib/data-collection/types";
import { cn } from "@/lib/utils";
import type { StepProps } from "./step-identity-purpose";

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-sm transition-colors hover:border-voice/40",
        active && "border-voice bg-voice-soft text-voice",
      )}
    >
      {active && <Check className="size-3.5" aria-hidden />}
      {children}
    </button>
  );
}

export function StepAiQuestions({
  draft,
  update,
  showErrors,
  loading,
  error,
  onRegenerate,
  onUseDefaults,
}: StepProps & {
  loading: boolean;
  error: string | null;
  onRegenerate: () => void;
  onUseDefaults: () => void;
}) {
  const answerFor = (id: string): SetupAnswer =>
    draft.setupAnswers.find((a) => a.questionId === id) ?? {
      questionId: id,
      value: null,
      skipped: false,
    };
  const setAnswer = (id: string, patch: Partial<SetupAnswer>) => {
    const others = draft.setupAnswers.filter((a) => a.questionId !== id);
    update({ setupAnswers: [...others, { ...answerFor(id), ...patch }] });
  };

  if (loading)
    return (
      <div className="grid gap-3" aria-busy>
        <p className="text-sm text-muted-foreground">Preparing questions…</p>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    );

  if (error)
    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-6 text-center">
        <p className="font-semibold">Couldn't generate questions</p>
        <p className="mt-1 text-sm text-muted-foreground">{error}</p>
        <div className="mt-4 flex justify-center gap-2">
          <Button variant="outline" onClick={onRegenerate}>
            <RefreshCw /> Retry
          </Button>
          <Button onClick={onUseDefaults}>Use default questions</Button>
        </div>
      </div>
    );

  const unanswered = (q: SetupQuestion) => {
    const a = answerFor(q.id);
    if (a.skipped) return false;
    return (
      a.value === null ||
      (Array.isArray(a.value) && !a.value.length) ||
      (typeof a.value === "string" && !a.value.trim())
    );
  };

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          This shapes your instructions and data fields.
        </p>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={onUseDefaults}>
            <Wand2 /> Fill suggested answers
          </Button>
          <Button variant="ghost" size="sm" onClick={onRegenerate}>
            <RefreshCw /> Regenerate questions
          </Button>
        </div>
      </div>
      {draft.setupQuestions.map((q, idx) => {
        const a = answerFor(q.id);
        const flagged = showErrors && unanswered(q);
        return (
          <section
            key={q.id}
            className={cn(
              "rounded-xl border border-border bg-card p-4 shadow-sm",
              a.skipped && "opacity-60",
              flagged && "border-destructive",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Question {idx + 1}</p>
                <h3 className="font-semibold">{q.question}</h3>
                <p className="text-xs text-muted-foreground">{q.helper}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAnswer(q.id, { skipped: !a.skipped })}
              >
                {a.skipped ? "Undo skip" : "Skip"}
              </Button>
            </div>
            {!a.skipped && (
              <div className="mt-3">
                {q.kind === "chips" && (
                  <div className="flex flex-wrap gap-2">
                    {q.options.map((o) => (
                      <Chip
                        key={o}
                        active={a.value === o}
                        onClick={() => setAnswer(q.id, { value: o })}
                      >
                        {o}
                      </Chip>
                    ))}
                    <Input
                      className="h-9 w-48"
                      placeholder="Something else…"
                      value={
                        typeof a.value === "string" && !q.options.includes(a.value) ? a.value : ""
                      }
                      onChange={(e) => setAnswer(q.id, { value: e.target.value })}
                      aria-label={`${q.question} other`}
                    />
                  </div>
                )}
                {q.kind === "multi_chips" && (
                  <div className="flex flex-wrap gap-2">
                    {q.options.map((o) => {
                      const list = Array.isArray(a.value) ? a.value : [];
                      const on = list.includes(o);
                      return (
                        <Chip
                          key={o}
                          active={on}
                          onClick={() =>
                            setAnswer(q.id, {
                              value: on ? list.filter((x) => x !== o) : [...list, o],
                            })
                          }
                        >
                          {o}
                        </Chip>
                      );
                    })}
                  </div>
                )}
                {q.kind === "text" && (
                  <Input
                    value={typeof a.value === "string" ? a.value : ""}
                    placeholder={q.helper}
                    onChange={(e) => setAnswer(q.id, { value: e.target.value })}
                    aria-label={q.question}
                  />
                )}
                {q.kind === "yes_no" && (
                  <div className="flex gap-2">
                    <Chip
                      active={a.value === true}
                      onClick={() => setAnswer(q.id, { value: true })}
                    >
                      Yes
                    </Chip>
                    <Chip
                      active={a.value === false}
                      onClick={() => setAnswer(q.id, { value: false })}
                    >
                      No
                    </Chip>
                  </div>
                )}
              </div>
            )}
            {flagged && (
              <p className="mt-2 text-xs text-destructive">Answer or skip this question.</p>
            )}
          </section>
        );
      })}
    </div>
  );
}
