import { createContext, useCallback, useContext, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const ConfirmContext = createContext(null);

const DEFAULTS = {
  title: "Are you sure?",
  description: "",
  confirmText: "Confirm",
  cancelText: "Cancel",
  tone: "default", // "default" | "destructive"
};

/**
 * Provides an imperative `confirm(options) => Promise<boolean>` used for
 * destructive/irreversible actions instead of window.confirm.
 */
export function ConfirmProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState(DEFAULTS);
  const [busy, setBusy] = useState(false);
  const resolver = useRef(null);

  const confirm = useCallback((opts = {}) => {
    setOptions({ ...DEFAULTS, ...opts });
    setOpen(true);
    return new Promise((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const settle = useCallback((value) => {
    resolver.current?.(value);
    resolver.current = null;
    setBusy(false);
    setOpen(false);
  }, []);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next && !busy) settle(false);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{options.title}</DialogTitle>
            {options.description && (
              <DialogDescription className="text-pretty">
                {options.description}
              </DialogDescription>
            )}
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => settle(false)} disabled={busy}>
              {options.cancelText}
            </Button>
            <Button
              variant={options.tone === "destructive" ? "destructive" : "default"}
              onClick={() => settle(true)}
              autoFocus
            >
              {options.confirmText}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return ctx;
}
