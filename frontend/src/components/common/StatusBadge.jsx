import { Badge } from "@/components/ui/badge";
import { REQUEST_STATUS, RIDE_STATUS } from "@/utils/constants";

/** Badge for a resource/ride request status ("pending" → amber, etc). */
export function RequestStatusBadge({ status, className }) {
  const meta = REQUEST_STATUS[status];
  if (!meta) return null;
  return (
    <Badge tone={meta.tone} className={className}>
      {meta.label}
    </Badge>
  );
}

/** Badge for a carpool ride status. */
export function RideStatusBadge({ status, className }) {
  const meta = RIDE_STATUS[status];
  if (!meta) return null;
  return (
    <Badge tone={meta.tone} className={className}>
      {meta.label}
    </Badge>
  );
}
