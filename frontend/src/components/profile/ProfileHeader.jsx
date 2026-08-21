import { CalendarDays, MapPin, AtSign, ShieldCheck } from "lucide-react";
import { UserAvatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/utils/format";

function Stat({ label, value }) {
  return (
    <div className="flex flex-col">
      <span className="text-lg font-bold leading-none text-foreground">{value ?? 0}</span>
      <span className="mt-1 text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

/**
 * Profile header used by both the current-user profile and other members'
 * profiles. Rendering is identical; `actions` (Edit / Message) are supplied by
 * the parent so this component stays presentational.
 */
export function ProfileHeader({ user, actions }) {
  if (!user) return null;
  const bio = user.profile?.bio;
  const neighborhood = user.profile?.neighborhood;
  const stats = user.stats || {};

  return (
    <Card className="overflow-hidden p-0">
      {/* Banner */}
      <div className="h-24 bg-gradient-to-r from-primary-600 to-primary-500 sm:h-28" />

      <div className="px-5 pb-5 sm:px-6 sm:pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <UserAvatar
              user={user}
              className="-mt-10 h-20 w-20 border-4 border-card shadow-sm sm:-mt-12 sm:h-24 sm:w-24"
            />
            <div className="pb-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  {user.full_name}
                </h1>
                {user.is_staff && (
                  <Badge tone="info" className="gap-1">
                    <ShieldCheck className="h-3 w-3" /> Admin
                  </Badge>
                )}
              </div>
              <p className="flex items-center gap-1 text-sm text-muted-foreground">
                <AtSign className="h-3.5 w-3.5" />
                {user.username}
              </p>
            </div>
          </div>

          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>

        {bio && (
          <p className="mt-4 max-w-2xl whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {bio}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
          {neighborhood && (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {neighborhood}
            </span>
          )}
          {user.date_joined && (
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" />
              Joined {formatDate(user.date_joined, "MMMM yyyy")}
            </span>
          )}
        </div>

        <div className="mt-5 flex gap-8 border-t border-border pt-4">
          <Stat label="Posts" value={stats.posts} />
          <Stat label="Resources" value={stats.resources} />
          <Stat label="Events" value={stats.events} />
        </div>
      </div>
    </Card>
  );
}
