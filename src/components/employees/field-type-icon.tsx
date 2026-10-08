import {
  AlignLeft,
  Calendar,
  CircleDot,
  Hash,
  ListChecks,
  Mail,
  Phone,
  Star,
  ToggleLeft,
  Type,
  type LucideIcon,
} from "lucide-react";
import { FIELD_TYPE_LABELS, type FieldType } from "@/lib/data-collection/types";

const ICONS: Record<FieldType, LucideIcon> = {
  single_select: CircleDot,
  multi_select: ListChecks,
  text: Type,
  long_text: AlignLeft,
  number: Hash,
  phone: Phone,
  email: Mail,
  date: Calendar,
  boolean: ToggleLeft,
  rating: Star,
};

export function FieldTypeBadge({ type }: { type: FieldType }) {
  const Icon = ICONS[type];
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-border bg-card px-2 py-0.5 text-xs font-medium text-foreground">
      <Icon className="size-3.5 text-muted-foreground" aria-hidden />
      {FIELD_TYPE_LABELS[type]}
    </span>
  );
}
