import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
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
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useIsMobile } from "@/hooks/use-mobile";
import { isSelectType, slugifyKey, variableToken } from "@/lib/data-collection/fields";
import {
  FIELD_TYPES,
  FIELD_TYPE_LABELS,
  type ConditionOperator,
  type DataField,
  type FieldType,
} from "@/lib/data-collection/types";

const OPERATORS: { id: ConditionOperator; label: string }[] = [
  { id: "equals", label: "is" },
  { id: "not_equals", label: "is not" },
  { id: "includes", label: "includes" },
  { id: "is_answered", label: "is answered" },
];

export function FieldEditorSheet({
  open,
  field,
  allFields,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  field: DataField | null;
  allFields: DataField[];
  onOpenChange: (open: boolean) => void;
  onSave: (field: DataField) => void;
}) {
  const isMobile = useIsMobile();
  const [draft, setDraft] = useState<DataField | null>(field);
  const [keyTouched, setKeyTouched] = useState(false);
  const [newOption, setNewOption] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setDraft(field);
    setKeyTouched(Boolean(field?.label));
    setNewOption("");
    setSubmitted(false);
  }, [field, open]);

  const others = useMemo(() => allFields.filter((f) => f.id !== field?.id), [allFields, field]);
  const parent = draft?.condition
    ? others.find((f) => f.key === draft.condition?.fieldKey)
    : undefined;

  if (!draft) return null;

  const set = (patch: Partial<DataField>) => setDraft((d) => (d ? { ...d, ...patch } : d));
  const keyTaken = others.some((f) => f.key === draft.key);
  const errors = {
    label: !draft.label.trim() ? "Field name is required" : "",
    key: !/^[a-z][a-z0-9_]*$/.test(draft.key)
      ? "Use lowercase letters, numbers and underscores"
      : keyTaken
        ? "This key is already used by another field"
        : "",
    prompt: draft.source === "ask" && !draft.prompt.trim() ? "Tell the AI how to ask this" : "",
    options:
      isSelectType(draft.type) && draft.options.filter((o) => o.trim()).length < 2
        ? "Add at least 2 options"
        : "",
  };
  const hasErrors = Object.values(errors).some(Boolean);

  const addOption = () => {
    const v = newOption.trim();
    if (!v || draft.options.includes(v)) return;
    set({ options: [...draft.options, v] });
    setNewOption("");
  };
  const moveOption = (i: number, d: -1 | 1) => {
    const next = draft.options.slice();
    const j = i + d;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j] as string, next[i] as string];
    set({ options: next });
  };

  const parentValues: string[] = parent
    ? parent.type === "boolean"
      ? ["Yes", "No"]
      : isSelectType(parent.type)
        ? parent.options
        : []
    : [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className="flex max-h-[92svh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-lg"
      >
        <SheetHeader className="border-b border-border px-6 py-5">
          <SheetTitle>{field?.label ? "Edit field" : "Add field"}</SheetTitle>
          <SheetDescription>
            The AI asks this naturally on the call and always saves the answer to the field key.
          </SheetDescription>
        </SheetHeader>
        <div className="grid flex-1 gap-5 overflow-y-auto px-6 py-5">
          <div className="grid gap-1.5">
            <Label htmlFor="fe-label">Label *</Label>
            <Input
              id="fe-label"
              value={draft.label}
              placeholder="e.g. Candidate supported"
              onChange={(e) =>
                set({
                  label: e.target.value,
                  ...(keyTouched ? {} : { key: slugifyKey(e.target.value) }),
                })
              }
            />
            {submitted && errors.label && (
              <p className="text-xs text-destructive">{errors.label}</p>
            )}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="fe-key">Key</Label>
            <Input
              id="fe-key"
              value={draft.key}
              className="font-mono text-sm"
              aria-invalid={Boolean(errors.key)}
              onChange={(e) => {
                setKeyTouched(true);
                set({ key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_") });
              }}
            />
            {errors.key ? (
              <p className="text-xs text-destructive">{errors.key}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Workflow variable: <code className="font-mono">{variableToken(draft.key)}</code>
              </p>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>Type *</Label>
              <Select
                value={draft.type}
                onValueChange={(v) => {
                  const type = v as FieldType;
                  set({
                    type,
                    options: isSelectType(type) ? draft.options : [],
                    validationHint: type === "rating" ? "1 to 5" : draft.validationHint,
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {FIELD_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Source</Label>
              <Select
                value={draft.source}
                onValueChange={(v) => set({ source: v as DataField["source"] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ask">Ask on call</SelectItem>
                  <SelectItem value="contact">From contact list</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
            <div>
              <Label htmlFor="fe-required">Required</Label>
              <p className="text-xs text-muted-foreground">
                A call is complete only when required fields are answered.
              </p>
            </div>
            <Switch
              className="data-[state=checked]:bg-voice"
              id="fe-required"
              checked={draft.required}
              onCheckedChange={(v) => set({ required: v })}
            />
          </div>
          {draft.source === "ask" && (
            <div className="grid gap-1.5">
              <Label htmlFor="fe-prompt">Prompt the AI uses *</Label>
              <Textarea
                id="fe-prompt"
                rows={3}
                value={draft.prompt}
                onChange={(e) => set({ prompt: e.target.value })}
              />
              {submitted && errors.prompt && (
                <p className="text-xs text-destructive">{errors.prompt}</p>
              )}
            </div>
          )}
          {isSelectType(draft.type) && (
            <div className="grid gap-2">
              <Label>Options *</Label>
              <ul className="grid gap-1.5">
                {draft.options.map((o, i) => (
                  <li
                    key={`${o}-${i}`}
                    className="flex items-center gap-1.5 rounded-lg border border-border px-2 py-1"
                  >
                    <Input
                      value={o}
                      className="h-8 border-0 px-1 shadow-none focus-visible:ring-0"
                      aria-label={`Option ${i + 1}`}
                      onChange={(e) => {
                        const next = draft.options.slice();
                        next[i] = e.target.value;
                        set({ options: next });
                      }}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7"
                      aria-label="Move option up"
                      onClick={() => moveOption(i, -1)}
                    >
                      <ArrowUp />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7"
                      aria-label="Move option down"
                      onClick={() => moveOption(i, 1)}
                    >
                      <ArrowDown />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7"
                      aria-label={`Remove ${o}`}
                      onClick={() => set({ options: draft.options.filter((_, j) => j !== i) })}
                    >
                      <X />
                    </Button>
                  </li>
                ))}
              </ul>
              <div className="flex gap-2">
                <Input
                  value={newOption}
                  placeholder="Add an option"
                  onChange={(e) => setNewOption(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addOption();
                    }
                  }}
                />
                <Button variant="outline" onClick={addOption}>
                  <Plus /> Add
                </Button>
              </div>
              {submitted && errors.options && (
                <p className="text-xs text-destructive">{errors.options}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Free speech is mapped to these values (e.g. “haven’t decided yet” → Undecided).
              </p>
            </div>
          )}
          <div className="grid gap-1.5">
            <Label htmlFor="fe-hint">Validation hint</Label>
            <Input
              id="fe-hint"
              value={draft.validationHint}
              placeholder="e.g. 10 digits, 1 to 5, DD-MM-YYYY"
              onChange={(e) => set({ validationHint: e.target.value })}
            />
          </div>
          <div className="grid gap-3 rounded-lg border border-border p-3">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="fe-cond">Conditional follow-up</Label>
                <p className="text-xs text-muted-foreground">
                  IF another answer matches, THEN ask this field.
                </p>
              </div>
              <Switch
                className="data-[state=checked]:bg-voice"
                id="fe-cond"
                checked={Boolean(draft.condition)}
                disabled={others.length === 0}
                onCheckedChange={(v) =>
                  set({
                    condition: v
                      ? { fieldKey: others[0]?.key ?? "", operator: "equals", value: "" }
                      : null,
                  })
                }
              />
            </div>
            {draft.condition && (
              <div className="grid gap-2 sm:grid-cols-[1.3fr_.8fr_1fr]">
                <Select
                  value={draft.condition.fieldKey}
                  onValueChange={(v) =>
                    set({ condition: { fieldKey: v, operator: "equals", value: "" } })
                  }
                >
                  <SelectTrigger aria-label="If field">
                    <SelectValue placeholder="Field" />
                  </SelectTrigger>
                  <SelectContent>
                    {others.map((f) => (
                      <SelectItem key={f.id} value={f.key}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={draft.condition.operator}
                  onValueChange={(v) =>
                    draft.condition &&
                    set({ condition: { ...draft.condition, operator: v as ConditionOperator } })
                  }
                >
                  <SelectTrigger aria-label="Operator">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OPERATORS.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {draft.condition.operator !== "is_answered" &&
                  (parentValues.length ? (
                    <Select
                      value={draft.condition.value}
                      onValueChange={(v) =>
                        draft.condition && set({ condition: { ...draft.condition, value: v } })
                      }
                    >
                      <SelectTrigger aria-label="Value">
                        <SelectValue placeholder="Value" />
                      </SelectTrigger>
                      <SelectContent>
                        {parentValues.filter(Boolean).map((v) => (
                          <SelectItem key={v} value={v}>
                            {v}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      aria-label="Value"
                      value={draft.condition.value}
                      placeholder="Value"
                      onChange={(e) =>
                        draft.condition &&
                        set({ condition: { ...draft.condition, value: e.target.value } })
                      }
                    />
                  ))}
              </div>
            )}
          </div>
        </div>
        <SheetFooter className="gap-2 border-t border-border px-6 py-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="bg-voice text-voice-foreground hover:bg-voice/90"
            onClick={() => {
              setSubmitted(true);
              if (hasErrors) return;
              onSave({
                ...draft,
                label: draft.label.trim(),
                options: draft.options.map((o) => o.trim()).filter(Boolean),
              });
            }}
          >
            Save field
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
