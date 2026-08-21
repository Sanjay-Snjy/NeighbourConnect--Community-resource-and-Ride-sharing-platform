import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader2,
  Camera,
  Trash2,
  Sun,
  Moon,
  LogOut,
  Settings as SettingsIcon,
} from "lucide-react";
import { profileSchema } from "@/schemas/profile.schema";
import { authService } from "@/services/auth.service";
import { parseApiError } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { useUIStore } from "@/store/uiStore";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { applyFieldErrors } from "@/lib/formErrors";
import { toFormData } from "@/lib/formData";
import { useConfirm } from "@/components/common/ConfirmDialog";
import { PageHeader } from "@/components/common/PageHeader";
import { FormField } from "@/components/common/FormField";
import { UserAvatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { FullPageSpinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/sonner";

const MAX_BYTES = 5 * 1024 * 1024; // mirror backend MAX_UPLOAD_SIZE (5MB)
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export default function Settings() {
  useDocumentTitle("Settings");
  const { user, setUser, logout } = useAuth();
  const confirm = useConfirm();

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileRef = useRef(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: "", bio: "", neighborhood: "", phone: "" },
  });

  useEffect(() => {
    if (user) {
      reset({
        full_name: user.full_name ?? "",
        bio: user.profile?.bio ?? "",
        neighborhood: user.profile?.neighborhood ?? "",
        phone: user.profile?.phone ?? "",
      });
    }
  }, [user, reset]);

  // Object URL lifecycle for the selected avatar preview.
  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview(null);
      return;
    }
    const url = URL.createObjectURL(avatarFile);
    setAvatarPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

  if (!user) return <FullPageSpinner />;

  function pickAvatar(file) {
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      toast.error("That file type isn't supported. Use JPG, PNG, WEBP or GIF.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Images must be 5MB or smaller.");
      return;
    }
    setAvatarFile(file);
  }

  const previewUser = {
    full_name: user.full_name,
    username: user.username,
    avatar: avatarPreview ?? user.profile?.avatar ?? null,
  };

  async function onSubmit(values) {
    // Nothing changed and no new avatar — skip the round-trip.
    if (!isDirty && !avatarFile) {
      toast.info("No changes to save.");
      return;
    }
    try {
      const payload = { ...values };
      if (avatarFile) payload.avatar = avatarFile;
      const body = avatarFile ? toFormData(payload) : payload;
      const updated = await authService.updateProfile(body);
      setUser(updated);
      setAvatarFile(null);
      reset({
        full_name: updated.full_name ?? "",
        bio: updated.profile?.bio ?? "",
        neighborhood: updated.profile?.neighborhood ?? "",
        phone: updated.profile?.phone ?? "",
      });
      toast.success("Profile updated.");
    } catch (err) {
      const parsed = parseApiError(err);
      if (!applyFieldErrors(parsed, setError)) toast.error(parsed.message);
    }
  }

  async function handleLogout() {
    const ok = await confirm({
      title: "Sign out?",
      description: "You'll need to sign back in to access your community.",
      confirmText: "Sign out",
    });
    if (ok) await logout();
  }

  return (
    <div className="container-page max-w-2xl py-8">
      <PageHeader
        icon={SettingsIcon}
        title="Settings"
        description="Manage your profile, account and preferences."
      />

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
        {/* Profile */}
        <Card className="p-5 sm:p-6">
          <h2 className="text-base font-semibold text-foreground">Profile</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            This is how neighbors see you across NeighbourHub.
          </p>

          <div className="mt-5 flex items-center gap-4">
            <UserAvatar user={previewUser} className="h-20 w-20" />
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                ref={fileRef}
                type="file"
                accept={ACCEPTED.join(",")}
                className="sr-only"
                onChange={(e) => pickAvatar(e.target.files?.[0])}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileRef.current?.click()}
              >
                <Camera className="h-4 w-4" /> Change photo
              </Button>
              {avatarFile && (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-muted-foreground"
                  onClick={() => {
                    setAvatarFile(null);
                    if (fileRef.current) fileRef.current.value = "";
                  }}
                >
                  <Trash2 className="h-4 w-4" /> Discard
                </Button>
              )}
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            JPG, PNG, WEBP or GIF, up to 5MB.
          </p>

          <div className="mt-6 space-y-4">
            <FormField
              label="Full name"
              htmlFor="full_name"
              required
              error={errors.full_name?.message}
            >
              <Input id="full_name" {...register("full_name")} />
            </FormField>

            <FormField
              label="Bio"
              htmlFor="bio"
              error={errors.bio?.message}
              hint="A short line about you — up to 280 characters."
            >
              <Textarea
                id="bio"
                rows={3}
                placeholder="Tell your neighbors a little about yourself…"
                {...register("bio")}
              />
            </FormField>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                label="Neighborhood"
                htmlFor="neighborhood"
                error={errors.neighborhood?.message}
              >
                <Input
                  id="neighborhood"
                  placeholder="e.g. Riverside Gardens"
                  {...register("neighborhood")}
                />
              </FormField>
              <FormField label="Phone" htmlFor="phone" error={errors.phone?.message}>
                <Input id="phone" placeholder="Optional" {...register("phone")} />
              </FormField>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button type="submit" disabled={isSubmitting || (!isDirty && !avatarFile)}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          </div>
        </Card>
      </form>

      {/* Account */}
      <Card className="mt-6 p-5 sm:p-6">
        <h2 className="text-base font-semibold text-foreground">Account</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Your login details. These can't be changed here.
        </p>
        <div className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <Label>Username</Label>
            <Input value={user.username} disabled readOnly />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={user.email} disabled readOnly />
          </div>
        </div>
      </Card>

      {/* Appearance */}
      <Card className="mt-6 p-5 sm:p-6">
        <h2 className="text-base font-semibold text-foreground">Appearance</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Choose how NeighbourHub looks on this device.
        </p>
        <ThemeToggle />
      </Card>

      {/* Session */}
      <Card className="mt-6 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">Sign out</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Sign out of your account on this device.
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </Card>
    </div>
  );
}

function ThemeToggle() {
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const isDark = theme === "dark";

  return (
    <div className="mt-5 flex items-center justify-between rounded-lg border border-border p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-foreground">
          {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </span>
        <div>
          <Label htmlFor="theme-toggle">Dark mode</Label>
          <p className="text-xs text-muted-foreground">
            {isDark ? "Dark theme is on." : "Using the light theme."}
          </p>
        </div>
      </div>
      <Switch
        id="theme-toggle"
        checked={isDark}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
      />
    </div>
  );
}
