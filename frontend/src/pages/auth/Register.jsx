import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { registerSchema } from "@/schemas/auth.schema";
import { useAuth } from "@/hooks/useAuth";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { parseApiError } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/common/FormField";
import { toast } from "@/components/ui/sonner";

export default function Register() {
  useDocumentTitle("Create account");
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: "",
      username: "",
      email: "",
      neighborhood: "",
      password: "",
      confirm_password: "",
    },
  });

  async function onSubmit(values) {
    try {
      const user = await registerUser(values);
      toast.success(`Welcome to the neighborhood, ${user.full_name || user.username}!`);
      navigate("/app", { replace: true });
    } catch (err) {
      const { message, fieldErrors } = parseApiError(err);
      Object.entries(fieldErrors).forEach(([field, msg]) => {
        setError(field, { message: msg });
      });
      if (message) setError("root", { message });
      toast.error(message || "We couldn't create your account.");
    }
  }

  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Join your neighbors in just a moment.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField label="Full name" htmlFor="full_name" error={errors.full_name?.message}>
          <Input
            id="full_name"
            autoComplete="name"
            placeholder="Priya Nair"
            aria-invalid={Boolean(errors.full_name)}
            {...register("full_name")}
          />
        </FormField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Username" htmlFor="username" error={errors.username?.message}>
            <Input
              id="username"
              autoComplete="username"
              placeholder="priya"
              aria-invalid={Boolean(errors.username)}
              {...register("username")}
            />
          </FormField>
          <FormField
            label="Neighborhood"
            htmlFor="neighborhood"
            error={errors.neighborhood?.message}
            hint="Optional"
          >
            <Input
              id="neighborhood"
              placeholder="Maple Grove"
              {...register("neighborhood")}
            />
          </FormField>
        </div>

        <FormField label="Email" htmlFor="email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={Boolean(errors.email)}
            {...register("email")}
          />
        </FormField>

        <FormField label="Password" htmlFor="password" error={errors.password?.message}>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              className="pr-10"
              aria-invalid={Boolean(errors.password)}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </FormField>

        <FormField
          label="Confirm password"
          htmlFor="confirm_password"
          error={errors.confirm_password?.message}
        >
          <Input
            id="confirm_password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Re-enter your password"
            aria-invalid={Boolean(errors.confirm_password)}
            {...register("confirm_password")}
          />
        </FormField>

        {errors.root && (
          <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {errors.root.message}
          </p>
        )}

        <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
