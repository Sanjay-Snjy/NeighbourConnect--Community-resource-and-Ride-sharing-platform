import { useEffect, useState } from "react";
import { useParams, useNavigate, Navigate, Link } from "react-router-dom";
import { MessageSquare, Loader2, UserX, ArrowLeft } from "lucide-react";
import { usersService } from "@/services/users.service";
import { messagesService } from "@/services/messages.service";
import { parseApiError } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { UserPostList } from "@/components/profile/UserPostList";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/sonner";

export default function MemberProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: me } = useAuth();

  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [messaging, setMessaging] = useState(false);

  useDocumentTitle(member ? member.full_name : "Member");

  // Own profile lives at /app/profile — redirect for a single source of truth.
  const isSelf = me && String(me.id) === String(userId);

  useEffect(() => {
    if (isSelf) return;
    let active = true;
    setLoading(true);
    setError(null);
    usersService
      .get(userId)
      .then((data) => active && setMember(data))
      .catch((err) => active && setError(parseApiError(err)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [userId, isSelf]);

  if (isSelf) return <Navigate to="/app/profile" replace />;

  async function handleMessage() {
    setMessaging(true);
    try {
      const conversation = await messagesService.startConversation(member.id);
      navigate(`/app/messages/${conversation.id}`);
    } catch (err) {
      toast.error(parseApiError(err).message);
      setMessaging(false);
    }
  }

  return (
    <div className="container-page max-w-2xl py-8">
      <Button
        variant="ghost"
        size="sm"
        className="mb-4 -ml-2 text-muted-foreground"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      {loading ? (
        <ProfileSkeleton />
      ) : error ? (
        error.status === 404 ? (
          <EmptyState
            icon={UserX}
            title="Member not found"
            description="This person may have left the community or the link is incorrect."
            action={
              <Button asChild>
                <Link to="/app/members">Browse members</Link>
              </Button>
            }
          />
        ) : (
          <ErrorState error={error} onRetry={() => window.location.reload()} />
        )
      ) : (
        <>
          <ProfileHeader
            user={member}
            actions={
              <Button onClick={handleMessage} disabled={messaging}>
                {messaging ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MessageSquare className="h-4 w-4" />
                )}
                Message
              </Button>
            }
          />

          <div className="mt-8">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Posts
            </h2>
            <UserPostList userId={member.id} />
          </div>
        </>
      )}
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <Card className="overflow-hidden p-0">
      <Skeleton className="h-28 w-full rounded-none" />
      <div className="px-6 pb-6">
        <Skeleton className="-mt-12 h-24 w-24 rounded-full border-4 border-card" />
        <Skeleton className="mt-4 h-5 w-40" />
        <Skeleton className="mt-2 h-3.5 w-24" />
        <Skeleton className="mt-4 h-3.5 w-3/4" />
        <div className="mt-6 flex gap-8 border-t border-border pt-4">
          <Skeleton className="h-9 w-12" />
          <Skeleton className="h-9 w-12" />
          <Skeleton className="h-9 w-12" />
        </div>
      </div>
    </Card>
  );
}
