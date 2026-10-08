import { Cloud, HardDrive } from "lucide-react";
import type { StoreMode } from "@/lib/data-collection/store";

export function StoreModeNote({ mode }: { mode: StoreMode | null }) {
  if (!mode) return null;
  if (mode === "workspace")
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Cloud className="size-3.5" aria-hidden /> Saved to your workspace
      </span>
    );
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted px-2 py-1 text-xs text-muted-foreground"
      title="No signed-in workspace session. Employees are kept in this browser until you sign in."
    >
      <HardDrive className="size-3.5" aria-hidden /> Local draft mode · this browser only
    </span>
  );
}
