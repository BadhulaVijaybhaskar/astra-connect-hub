import { motion, useReducedMotion } from "motion/react";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  GitBranch,
  GripVertical,
  MoreHorizontal,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useState, type KeyboardEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  makeField,
  moveField,
  newId,
  variableToken,
  type FieldIssue,
} from "@/lib/data-collection/fields";
import { conditionText } from "@/lib/data-collection/setup-engine";
import type { DataField } from "@/lib/data-collection/types";
import { cn } from "@/lib/utils";
import { FieldEditorSheet } from "./field-editor-sheet";
import { FieldTypeBadge } from "./field-type-icon";

export function DataCollectionTable({
  fields,
  onChange,
  issues = [],
  onUseSuggested,
  hasResults = false,
}: {
  fields: DataField[];
  onChange: (fields: DataField[]) => void;
  issues?: FieldIssue[];
  onUseSuggested?: () => void;
  hasResults?: boolean;
}) {
  const reduce = useReducedMotion();
  const [editing, setEditing] = useState<DataField | null>(null);
  const [open, setOpen] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);

  const issueFor = (id: string) => issues.find((i) => i.fieldId === id)?.message;

  const startAdd = () => {
    setEditing(makeField("", "text", { key: "", prompt: "" }));
    setOpen(true);
  };
  const startEdit = (f: DataField) => {
    setEditing(f);
    setOpen(true);
  };
  const save = (f: DataField) => {
    const exists = fields.some((x) => x.id === f.id);
    onChange(
      exists ? fields.map((x) => (x.id === f.id ? { ...f, suggested: false } : x)) : [...fields, f],
    );
    setOpen(false);
  };
  const duplicate = (f: DataField) => {
    let key = `${f.key}_copy`;
    let n = 2;
    while (fields.some((x) => x.key === key)) key = `${f.key}_copy_${n++}`;
    const copy: DataField = {
      ...f,
      id: newId("fld"),
      key,
      label: `${f.label} (copy)`,
      suggested: false,
    };
    const idx = fields.findIndex((x) => x.id === f.id);
    const next = fields.slice();
    next.splice(idx + 1, 0, copy);
    onChange(next);
  };
  const remove = (f: DataField) => {
    if (
      hasResults &&
      !window.confirm(
        `"${f.label}" already has results. Remove the field? Existing answers stay in past calls.`,
      )
    )
      return;
    const before = fields;
    onChange(fields.filter((x) => x.id !== f.id));
    toast(`Removed “${f.label}”`, {
      duration: 5000,
      action: { label: "Undo", onClick: () => onChange(before) },
    });
  };
  const move = (id: string, d: -1 | 1) => onChange(moveField(fields, id, d));
  const onRowKey = (e: KeyboardEvent, id: string) => {
    if (e.altKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
      e.preventDefault();
      move(id, e.key === "ArrowUp" ? -1 : 1);
    }
  };
  const onDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const from = fields.findIndex((f) => f.id === dragId);
    const to = fields.findIndex((f) => f.id === targetId);
    const next = fields.slice();
    const [item] = next.splice(from, 1);
    if (item) next.splice(to, 0, item);
    onChange(next);
    setDragId(null);
  };

  const menu = (f: DataField, i: number) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="size-8"
          aria-label={`Actions for ${f.label}`}
        >
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => startEdit(f)}>
          <Pencil /> Edit
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => duplicate(f)}>
          <Copy /> Duplicate
        </DropdownMenuItem>
        <DropdownMenuItem disabled={i === 0} onSelect={() => move(f.id, -1)}>
          <ArrowUp /> Move up
        </DropdownMenuItem>
        <DropdownMenuItem disabled={i === fields.length - 1} onSelect={() => move(f.id, 1)}>
          <ArrowDown /> Move down
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onSelect={() => remove(f)}
        >
          <Trash2 /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const setRequired = (id: string, v: boolean) =>
    onChange(fields.map((x) => (x.id === id ? { ...x, required: v } : x)));

  if (!fields.length)
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
        <p className="font-semibold">No fields yet.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Add what you want this employee to capture.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Button className="bg-voice text-voice-foreground hover:bg-voice/90" onClick={startAdd}>
            <Plus /> Add field
          </Button>
          {onUseSuggested && (
            <Button variant="outline" onClick={onUseSuggested}>
              <Sparkles /> Use suggested fields
            </Button>
          )}
        </div>
        <FieldEditorSheet
          open={open}
          field={editing}
          allFields={fields}
          onOpenChange={setOpen}
          onSave={save}
        />
      </div>
    );

  return (
    <TooltipProvider delayDuration={200}>
      <div className="grid gap-3">
        {/* Desktop table */}
        <div className="hidden overflow-hidden rounded-xl border border-border bg-card shadow-sm md:block">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left text-xs font-semibold text-muted-foreground">
              <tr>
                <th className="w-8 px-2 py-2.5" aria-label="Reorder" />
                <th className="px-3 py-2.5">Field name</th>
                <th className="px-3 py-2.5">Type</th>
                <th className="px-3 py-2.5">Required</th>
                <th className="px-3 py-2.5">Source / prompt</th>
                <th className="w-12 px-3 py-2.5" aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {fields.map((f, i) => {
                const issue = issueFor(f.id);
                return (
                  <motion.tr
                    key={f.id}
                    layout={!reduce}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    tabIndex={0}
                    aria-label={`${f.label}. Alt plus arrow keys to reorder.`}
                    onKeyDown={(e) => onRowKey(e, f.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => onDrop(f.id)}
                    className={cn(
                      "border-t border-border align-top outline-none focus-visible:bg-voice-soft",
                      dragId === f.id && "opacity-50",
                      issue &&
                        "bg-destructive/5 outline outline-1 -outline-offset-1 outline-destructive",
                    )}
                  >
                    <td className="px-2 py-3">
                      <span
                        draggable
                        onDragStart={() => setDragId(f.id)}
                        onDragEnd={() => setDragId(null)}
                        className="grid size-6 cursor-grab place-items-center rounded text-muted-foreground hover:bg-muted"
                        aria-hidden
                      >
                        <GripVertical className="size-4" />
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          className="text-left font-semibold hover:underline"
                          onClick={() => startEdit(f)}
                        >
                          {f.label || "Untitled field"}
                        </button>
                        {f.suggested && (
                          <span className="rounded-md bg-voice-soft px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-voice">
                            Suggested
                          </span>
                        )}
                      </div>
                      <code className="block font-mono text-xs text-muted-foreground">
                        {variableToken(f.key)}
                      </code>
                      {f.condition && (
                        <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <GitBranch className="size-3" aria-hidden /> {conditionText(f)}
                        </p>
                      )}
                      {issue && <p className="mt-1 text-xs text-destructive">{issue}</p>}
                    </td>
                    <td className="px-3 py-3">
                      <FieldTypeBadge type={f.type} />
                      {f.options.length > 0 && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {f.options.length} options
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <Switch
                        className="data-[state=checked]:bg-voice"
                        checked={f.required}
                        aria-label={`${f.label} required`}
                        onCheckedChange={(v) => setRequired(f.id, v)}
                      />
                    </td>
                    <td className="max-w-[22rem] px-3 py-3 text-muted-foreground">
                      {f.source === "contact" ? (
                        <span className="italic">From contact list</span>
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="line-clamp-2 cursor-default">{f.prompt}</span>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-sm">{f.prompt}</TooltipContent>
                        </Tooltip>
                      )}
                    </td>
                    <td className="px-3 py-2">{menu(f, i)}</td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* Mobile cards */}
        <ul className="grid gap-2 md:hidden">
          {fields.map((f, i) => {
            const issue = issueFor(f.id);
            return (
              <li
                key={f.id}
                className={cn(
                  "rounded-xl border border-border bg-card p-3 shadow-sm",
                  issue && "border-destructive",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold">{f.label || "Untitled field"}</p>
                    <code className="font-mono text-xs text-muted-foreground">{f.key}</code>
                  </div>
                  {menu(f, i)}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <FieldTypeBadge type={f.type} />
                  {f.required && (
                    <span className="rounded-full bg-voice-soft px-2 py-0.5 text-xs font-semibold text-voice">
                      Required
                    </span>
                  )}
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                  {f.source === "contact" ? "From contact list" : f.prompt}
                </p>
                {issue && <p className="mt-1 text-xs text-destructive">{issue}</p>}
              </li>
            );
          })}
        </ul>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button variant="outline" onClick={startAdd}>
            <Plus /> Add field
          </Button>
          <p className="text-xs text-muted-foreground">
            Order = the order asked on the call. Drag, use the ⋯ menu, or Alt+↑/↓ on a focused row.
          </p>
        </div>
        <FieldEditorSheet
          open={open}
          field={editing}
          allFields={fields}
          onOpenChange={setOpen}
          onSave={save}
        />
      </div>
    </TooltipProvider>
  );
}
