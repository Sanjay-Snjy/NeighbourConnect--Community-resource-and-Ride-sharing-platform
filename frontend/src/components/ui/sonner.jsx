import { Toaster as SonnerToaster, toast } from "sonner";
import { useUIStore } from "@/store/uiStore";

/** App-wide toast host. Mount once near the router root. */
export function Toaster() {
  const theme = useUIStore((s) => s.theme);
  return (
    <SonnerToaster
      theme={theme}
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "rounded-lg border border-border bg-card text-card-foreground shadow-popover",
          description: "text-muted-foreground",
        },
      }}
    />
  );
}

export { toast };
