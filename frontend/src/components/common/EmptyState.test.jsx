import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Inbox } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";

describe("EmptyState", () => {
  it("renders the title and description", () => {
    render(
      <EmptyState
        icon={Inbox}
        title="No messages yet"
        description="Start a conversation with a neighbor."
      />,
    );

    expect(screen.getByText("No messages yet")).toBeInTheDocument();
    expect(
      screen.getByText("Start a conversation with a neighbor."),
    ).toBeInTheDocument();
  });

  it("renders an action when provided", () => {
    render(
      <EmptyState
        title="No events"
        action={<button type="button">Create event</button>}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Create event" }),
    ).toBeInTheDocument();
  });

  it("omits the description paragraph when none is given", () => {
    render(<EmptyState title="Nothing here" />);

    expect(screen.getByText("Nothing here")).toBeInTheDocument();
    // Only the heading should be present — no stray description node.
    expect(screen.queryByText(/./, { selector: "p" })).toBeNull();
  });
});
