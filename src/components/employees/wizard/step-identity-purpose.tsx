import {
  BriefcaseBusiness,
  CalendarCheck,
  ClipboardList,
  Headset,
  MessageSquareHeart,
  Sparkles,
  Vote,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { LANGUAGES, VOICE_PRESETS } from "@/lib/data-collection/draft";
import { VERTICAL_TEMPLATES } from "@/lib/data-collection/catalog";
import { detectVertical } from "@/lib/data-collection/setup-engine";
import type { CallStatus, EmployeeDraft, Vertical } from "@/lib/data-collection/types";
import { cn } from "@/lib/utils";

export interface StepProps {
  draft: EmployeeDraft;
  update: (patch: Partial<EmployeeDraft>) => void;
  showErrors: boolean;
}

function FieldError({ show, msg }: { show: boolean; msg: string }) {
  if (!show || !msg) return null;
  return <p className="text-xs text-destructive">{msg}</p>;
}

export function StepIdentity({
  draft,
  update,
  showErrors,
  duplicateName,
}: StepProps & { duplicateName: boolean }) {
  const initials =
    draft.name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "AI";
  const nameLen = draft.name.trim().length;
  return (
    <div className="grid gap-5">
      <div className="flex items-center gap-4">
        <span
          className="grid size-14 shrink-0 place-items-center rounded-full bg-voice-soft text-lg font-semibold text-voice"
          aria-hidden
        >
          {initials}
        </span>
        <p className="text-sm text-muted-foreground">
          Name the employee and give it a voice. You can change these later.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="emp-name">Employee name *</Label>
          <Input
            id="emp-name"
            value={draft.name}
            maxLength={40}
            placeholder="e.g. Priya"
            onChange={(e) => update({ name: e.target.value })}
          />
          <FieldError
            show={showErrors}
            msg={
              !nameLen
                ? "Name is required"
                : nameLen < 2
                  ? "Name must be at least 2 characters"
                  : ""
            }
          />
          {duplicateName && (
            <p className="text-xs text-muted-foreground">
              Another employee already uses this name.
            </p>
          )}
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="emp-role">Role title *</Label>
          <Input
            id="emp-role"
            value={draft.role}
            maxLength={120}
            placeholder="e.g. Lead qualifier"
            onChange={(e) => update({ role: e.target.value })}
          />
          <FieldError show={showErrors} msg={!draft.role.trim() ? "Role is required" : ""} />
        </div>
        <div className="grid gap-1.5">
          <Label>Voice *</Label>
          <Select value={draft.voice} onValueChange={(v) => update({ voice: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a voice" />
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
          <Label>Language *</Label>
          <Select value={draft.language} onValueChange={(v) => update({ language: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a language" />
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
        <div className="grid gap-1.5 sm:col-span-2">
          <Label htmlFor="emp-brand">Business / brand name</Label>
          <Input
            id="emp-brand"
            value={draft.brand}
            maxLength={80}
            placeholder="e.g. Astra Voice"
            onChange={(e) => update({ brand: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}

const TEMPLATE_CARDS: { id: string; label: string; vertical: Vertical; icon: typeof Sparkles }[] = [
  { id: "lead", label: "Lead qualification", vertical: "sales", icon: BriefcaseBusiness },
  { id: "appointment", label: "Appointment booking", vertical: "healthcare", icon: CalendarCheck },
  { id: "feedback", label: "Feedback survey", vertical: "feedback", icon: MessageSquareHeart },
  { id: "opinion", label: "Public opinion survey", vertical: "politics", icon: Vote },
  { id: "support", label: "Support intake", vertical: "support", icon: Headset },
  { id: "custom", label: "Custom", vertical: "general", icon: ClipboardList },
];

const VERTICAL_OPTIONS = (Object.keys(VERTICAL_TEMPLATES) as Vertical[]).map((v) => ({
  id: v,
  label: VERTICAL_TEMPLATES[v].label,
}));

export function StepPurpose({ draft, update, showErrors }: StepProps) {
  const onPurpose = (purpose: string) => {
    const patch: Partial<EmployeeDraft> = { purpose };
    if (!draft.template || draft.template === "auto") {
      const v = detectVertical(purpose);
      patch.vertical = v;
      patch.template = "auto";
      patch.successOutcome = VERTICAL_TEMPLATES[v].successOutcome;
    }
    update(patch);
  };
  return (
    <div className="grid gap-5">
      <div className="grid gap-1.5">
        <Label htmlFor="emp-purpose" className="text-base">
          Tell us what this AI Employee should do *
        </Label>
        <Textarea
          id="emp-purpose"
          rows={6}
          maxLength={2000}
          value={draft.purpose}
          className="text-base"
          placeholder="Example: I want this employee to call people and conduct a political survey to understand which candidate they support, which candidate they reject, their main local issue and likelihood to vote."
          onChange={(e) => onPurpose(e.target.value)}
        />
        <FieldError
          show={showErrors}
          msg={
            draft.purpose.trim().length < 15
              ? "Describe the job in a sentence or two (at least 15 characters)"
              : ""
          }
        />
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">Use case:</span>
          <Select
            value={draft.vertical}
            onValueChange={(v) => {
              const vertical = v as Vertical;
              update({
                vertical,
                template: "manual",
                successOutcome: VERTICAL_TEMPLATES[vertical].successOutcome,
              });
            }}
          >
            <SelectTrigger
              className="h-8 w-auto gap-2 rounded-full border-voice/30 bg-voice-soft px-3 text-voice"
              aria-label="Use case"
            >
              <Sparkles className="size-3.5" aria-hidden />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VERTICAL_OPTIONS.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground">
            {draft.template === "auto" ? "Detected from your description" : "Chosen by you"}
          </span>
        </div>
      </div>
      <div className="grid gap-2">
        <Label>Or start from a template</Label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {TEMPLATE_CARDS.map((t) => {
            const Icon = t.icon;
            const active = draft.template === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() =>
                  update({
                    template: t.id,
                    vertical: t.vertical,
                    successOutcome: VERTICAL_TEMPLATES[t.vertical].successOutcome,
                  })
                }
                className={cn(
                  "flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2.5 text-left text-sm font-medium transition-colors hover:border-voice/40",
                  active && "border-voice bg-voice-soft text-voice",
                )}
                aria-pressed={active}
              >
                <Icon className="size-4 shrink-0" aria-hidden />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label>Call direction</Label>
          <div
            className="inline-flex rounded-lg border border-border bg-muted p-1"
            role="radiogroup"
            aria-label="Call direction"
          >
            {(["outbound", "inbound"] as const).map((d) => (
              <button
                key={d}
                type="button"
                role="radio"
                aria-checked={draft.direction === d}
                onClick={() => update({ direction: d })}
                className={cn(
                  "flex-1 rounded-md px-3 py-1.5 text-sm font-medium capitalize text-muted-foreground",
                  draft.direction === d && "bg-card text-foreground shadow-sm",
                )}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label>Success outcome *</Label>
          <Select
            value={draft.successOutcome}
            onValueChange={(v) => update({ successOutcome: v as CallStatus })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(["Qualified", "Completed", "Callback"] as const).map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="emp-goal">Goal statement (optional)</Label>
        <Input
          id="emp-goal"
          value={draft.goal}
          maxLength={300}
          placeholder="e.g. Get 500 completed survey responses per constituency."
          onChange={(e) => update({ goal: e.target.value })}
        />
      </div>
    </div>
  );
}
