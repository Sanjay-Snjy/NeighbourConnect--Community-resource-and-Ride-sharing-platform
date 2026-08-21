import { Link } from "react-router-dom";
import { Home, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { StatusScreen } from "@/components/common/StatusScreen";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  useDocumentTitle("Page not found");
  const { isAuthenticated } = useAuth();

  return (
    <StatusScreen
      code="404"
      title="This page took a wrong turn"
      description="The page you're looking for doesn't exist or may have moved. Let's get you back to familiar streets."
    >
      {isAuthenticated ? (
        <>
          <Button asChild>
            <Link to="/app">
              <LayoutDashboard className="h-4 w-4" /> Back to dashboard
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/app/search">Search the community</Link>
          </Button>
        </>
      ) : (
        <>
          <Button asChild>
            <Link to="/">
              <Home className="h-4 w-4" /> Go home
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/login">Sign in</Link>
          </Button>
        </>
      )}
    </StatusScreen>
  );
}
