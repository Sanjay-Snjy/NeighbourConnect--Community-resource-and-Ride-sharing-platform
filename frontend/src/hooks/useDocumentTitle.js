import { useEffect } from "react";

/** Set document.title, restoring the previous title on unmount. */
export function useDocumentTitle(title) {
  useEffect(() => {
    const previous = document.title;
    document.title = title ? `${title} · NeighbourConnect` : "NeighbourConnect";
    return () => {
      document.title = previous;
    };
  }, [title]);
}
