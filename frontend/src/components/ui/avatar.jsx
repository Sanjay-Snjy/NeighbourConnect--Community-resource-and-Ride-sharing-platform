import { forwardRef } from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "@/lib/utils";
import { initials, tintFor } from "@/utils/format";

export const Avatar = forwardRef(function Avatar({ className, ...props }, ref) {
  return (
    <AvatarPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
        className,
      )}
      {...props}
    />
  );
});

export const AvatarImage = forwardRef(function AvatarImage(
  { className, ...props },
  ref,
) {
  return (
    <AvatarPrimitive.Image
      ref={ref}
      className={cn("aspect-square h-full w-full object-cover", className)}
      {...props}
    />
  );
});

export const AvatarFallback = forwardRef(function AvatarFallback(
  { className, ...props },
  ref,
) {
  return (
    <AvatarPrimitive.Fallback
      ref={ref}
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full text-sm font-semibold",
        className,
      )}
      {...props}
    />
  );
});

/**
 * Convenience wrapper: renders a user's avatar image or tinted initials.
 * Accepts either the compact author shape ({ full_name, username, avatar })
 * or the full profile shape where the image lives at `profile.avatar`.
 */
export function UserAvatar({ user, className, size }) {
  const name = user?.full_name || user?.username || "";
  const avatar = user?.avatar ?? user?.profile?.avatar ?? null;
  const dimension = size ? { height: size, width: size } : undefined;
  return (
    <Avatar className={className} style={dimension}>
      {avatar ? <AvatarImage src={avatar} alt={name} /> : null}
      <AvatarFallback className={tintFor(name)}>{initials(name)}</AvatarFallback>
    </Avatar>
  );
}
