import { Component } from "react";
import { AlertTriangle } from "lucide-react";
import { StatusScreen } from "@/components/common/StatusScreen";
import { Button } from "@/components/ui/button";

/**
 * Top-level error boundary. Catches render-time errors anywhere in the tree and
 * shows a friendly recovery screen instead of a blank white page.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // In production this is where we'd forward to an error reporter (Sentry…).
    // eslint-disable-next-line no-console
    console.error("Uncaught error:", error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.assign("/");
  };

  render() {
    if (this.state.hasError) {
      return (
        <StatusScreen
          icon={AlertTriangle}
          title="Something went wrong"
          description="An unexpected error occurred on our end. Reloading usually does the trick."
        >
          <Button onClick={() => window.location.reload()}>Reload page</Button>
          <Button variant="outline" onClick={this.handleReload}>
            Go home
          </Button>
        </StatusScreen>
      );
    }
    return this.props.children;
  }
}
