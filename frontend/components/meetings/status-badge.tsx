import { AlertTriangle, CheckCircle2, CircleDashed, Loader2, XCircle } from "lucide-react";

import { Badge, type BadgeProps } from "@/components/ui/badge";
import type { MeetingStatus } from "@/types";

const STATUS_CONFIG: Record<
  MeetingStatus,
  { label: string; variant: BadgeProps["variant"]; icon: React.ComponentType<{ className?: string }> }
> = {
  draft: { label: "Draft", variant: "secondary", icon: CircleDashed },
  processing: { label: "Processing", variant: "violet", icon: Loader2 },
  review_required: { label: "Review Required", variant: "warning", icon: AlertTriangle },
  completed: { label: "Completed", variant: "success", icon: CheckCircle2 },
  failed: { label: "Failed", variant: "danger", icon: XCircle },
};

export function MeetingStatusBadge({ status, className }: { status: MeetingStatus; className?: string }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  const Icon = config.icon;
  return (
    <Badge variant={config.variant} className={className}>
      <Icon className="h-3 w-3" aria-hidden="true" />
      {config.label}
    </Badge>
  );
}
