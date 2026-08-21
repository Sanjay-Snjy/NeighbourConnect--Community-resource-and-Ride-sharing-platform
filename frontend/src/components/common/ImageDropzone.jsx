import { useEffect, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

const MAX_BYTES = 5 * 1024 * 1024; // mirrors backend MAX_UPLOAD_SIZE (5MB)
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/**
 * Accessible image picker with drag-and-drop, preview and clear.
 * Calls `onChange(File | null)`; validates type & size client-side.
 */
export function ImageDropzone({ value, onChange, className, label = "Add a photo" }) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (value instanceof File) {
      const url = URL.createObjectURL(value);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    if (typeof value === "string") setPreview(value);
    else setPreview(null);
  }, [value]);

  function validateAndSet(file) {
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      toast.error("That file type isn't supported. Use JPG, PNG, WEBP or GIF.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Images must be 5MB or smaller.");
      return;
    }
    onChange?.(file);
  }

  function clear(e) {
    e.stopPropagation();
    onChange?.(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        className="sr-only"
        onChange={(e) => validateAndSet(e.target.files?.[0])}
      />
      {preview ? (
        <div className="group relative overflow-hidden rounded-lg border border-border">
          <img
            src={preview}
            alt="Selected preview"
            className="max-h-64 w-full object-cover"
          />
          <Button
            type="button"
            variant="secondary"
            size="icon-sm"
            className="absolute right-2 top-2 shadow-md"
            onClick={clear}
            aria-label="Remove image"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            validateAndSet(e.dataTransfer.files?.[0]);
          }}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-input bg-muted/40 px-4 py-8 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:bg-accent",
            dragging && "border-primary bg-accent",
          )}
        >
          <ImagePlus className="h-6 w-6" />
          <span className="font-medium text-foreground">{label}</span>
          <span className="text-xs">Drag & drop or click · JPG, PNG, WEBP up to 5MB</span>
        </button>
      )}
    </div>
  );
}
