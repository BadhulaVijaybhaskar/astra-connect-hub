import type { CallStatus } from "@/lib/data-collection/types";
import { cn } from "@/lib/utils";

const TONE: Record<CallStatus, string> = {
  Ready: "border-border bg-muted text-muted-foreground",
  Calling: "border-voice/30 bg-voice-soft text-voice",
  Connected: "border-voice/30 bg-voice-soft text-voice",
  Completed: "border-success/30 bg-success/10 text-success",
  Qualified: "border-success/30 bg-success/10 text-success",
  Callback: "border-warning/40 bg-warning/10 text-foreground",
  "Not interested": "border-border bg-muted text-muted-foreground",
  "No answer": "border-border bg-muted text-muted-foreground",
  Failed: "border-destructive/30 bg-destructive/10 text-destructive",
};

/** Shared badge for the 9 locked call statuses. */
export function StatusBadge({ status, className }: { status: CallStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-semibold",
        TONE[status],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {status}
    </span>
  );
}

export function SampleBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border border-warning/40 bg-warning/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-foreground",
        className,
      )}
      title="Seeded demo data. Not from a live call."
    >
      Sample
    </span>
  );
}
