import { Link } from "react-router-dom";
import { Pencil, Settings as SettingsIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { UserPostList } from "@/components/profile/UserPostList";
import { Button } from "@/components/ui/button";
import { FullPageSpinner } from "@/components/ui/spinner";

export default function Profile() {
  useDocumentTitle("My profile");
  const { user } = useAuth();

  if (!user) return <FullPageSpinner />;

  return (
    <div className="container-page max-w-2xl py-8">
      <ProfileHeader
        user={user}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/app/settings">
                <SettingsIcon className="h-4 w-4" /> Settings
              </Link>
            </Button>
            <Button asChild>
              <Link to="/app/settings">
                <Pencil className="h-4 w-4" /> Edit profile
              </Link>
            </Button>
          </>
        }
      />

      <div className="mt-8">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Your posts
        </h2>
        <UserPostList userId={user.id} isMe />
      </div>
    </div>
  );
}
