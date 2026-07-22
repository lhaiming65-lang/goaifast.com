import { useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { appBaseUrl, appUrl } from "@/lib/appUrl";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Loader2, Mail, Lock, User as UserIcon } from "lucide-react";
import SocialAuthButtons from "./SocialAuthButtons";

type Mode = "signin" | "signup" | "forgot";

interface Props {
  initialMode?: Mode;
  onSuccess?: () => void;
  compact?: boolean;
}

export default function AuthForm({ initialMode = "signin", onSuccess, compact = false }: Props) {
  const { t } = useTranslation();
  // Auth page's useEffect + modal onSuccess handle redirect/close after session updates
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  const emailSchema = z.string().trim().email({ message: t("auth.invalidEmail") }).max(255);
  const passwordSchema = z.string().min(6, { message: t("auth.passwordTooShort") }).max(72);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailParsed = emailSchema.safeParse(email);
    if (!emailParsed.success) {
      toast.error(emailParsed.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(emailParsed.data, {
          redirectTo: appUrl("/reset-password"),
        });
        if (error) throw error;
        toast.success(t("auth.resetLinkSent"));
        setMode("signin");
      } else if (mode === "signin") {
        const pwdParsed = passwordSchema.safeParse(password);
        if (!pwdParsed.success) {
          toast.error(pwdParsed.error.issues[0].message);
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.signInWithPassword({
          email: emailParsed.data,
          password: pwdParsed.data,
        });
        if (error) throw error;
        toast.success(t("auth.signInSuccess"));
        onSuccess?.();
      } else {
        // signup
        const pwdParsed = passwordSchema.safeParse(password);
        if (!pwdParsed.success) {
          toast.error(pwdParsed.error.issues[0].message);
          setLoading(false);
          return;
        }
        if (password !== confirm) {
          toast.error(t("auth.passwordMismatch"));
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email: emailParsed.data,
          password: pwdParsed.data,
          options: {
            emailRedirectTo: appBaseUrl(),
            data: { full_name: fullName.trim() || null },
          },
        });
        if (error) throw error;
        toast.success(t("auth.signUpCheckEmail"));
        setMode("signin");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const title =
    mode === "signin" ? t("auth.welcomeBack") :
    mode === "signup" ? t("auth.createAccount") :
    t("auth.forgotPasswordTitle");

  const subtitle =
    mode === "signin" ? t("auth.signInSubtitle") :
    mode === "signup" ? t("auth.signUpSubtitle") :
    t("auth.forgotPasswordSubtitle");

  return (
    <div className={compact ? "" : "w-full max-w-md"}>
      <div className="text-center mb-5">
        <h1 className="text-2xl font-bold bg-gradient-brand bg-clip-text text-transparent">{title}</h1>
        <p className="text-sm text-muted-foreground mt-1.5">{subtitle}</p>
      </div>

      {mode !== "forgot" && (
        <>
          <div className="grid grid-cols-2 gap-1 p-1 mb-5 rounded-xl bg-secondary/60 border border-border">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`h-9 rounded-lg text-sm font-medium transition-all ${
                mode === "signin"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("auth.signIn")}
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`h-9 rounded-lg text-sm font-medium transition-all ${
                mode === "signup"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("auth.signUp")}
            </button>
          </div>

          <SocialAuthButtons />
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-3 text-muted-foreground">{t("auth.orContinueWith")}</span>
            </div>
          </div>
        </>
      )}


      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "signup" && (
          <div className="space-y-2">
            <Label htmlFor="fullName">{t("auth.fullName")}</Label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t("auth.fullNamePlaceholder")}
                className="pl-10 h-11"
                maxLength={100}
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">{t("auth.email")}</Label>
          <div className="relative">
            <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("auth.emailPlaceholder")}
              className="pl-10 h-11"
              required
              maxLength={255}
              autoComplete="email"
            />
          </div>
        </div>

        {mode !== "forgot" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">{t("auth.password")}</Label>
              {mode === "signin" && (
                <button
                  type="button"
                  onClick={() => setMode("forgot")}
                  className="text-xs text-primary hover:underline"
                >
                  {t("auth.forgotPassword")}
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("auth.passwordPlaceholder")}
                className="pl-10 h-11"
                required
                minLength={6}
                maxLength={72}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
              />
            </div>
          </div>
        )}

        {mode === "signup" && (
          <div className="space-y-2">
            <Label htmlFor="confirm">{t("auth.confirmPassword")}</Label>
            <div className="relative">
              <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder={t("auth.passwordPlaceholder")}
                className="pl-10 h-11"
                required
                minLength={6}
                maxLength={72}
                autoComplete="new-password"
              />
            </div>
          </div>
        )}

        <Button
          type="submit"
          className="w-full h-11 rounded-xl bg-gradient-brand hover:opacity-90 transition-opacity text-white font-medium"
          disabled={loading}
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          {mode === "signin" ? (loading ? t("auth.signingIn") : t("auth.signIn")) :
           mode === "signup" ? (loading ? t("auth.signingUp") : t("auth.signUp")) :
           t("auth.sendResetLink")}
        </Button>

        {mode === "signup" && (
          <p className="text-xs text-center text-muted-foreground">
            {t("auth.agreeTerms")}{" "}
            <a href="#" className="text-primary hover:underline">{t("auth.termsOfService")}</a>
            {" · "}
            <a href="#" className="text-primary hover:underline">{t("auth.privacyPolicy")}</a>
          </p>
        )}
      </form>

      {mode === "forgot" && (
        <div className="mt-6 text-center text-sm">
          <button onClick={() => setMode("signin")} className="text-primary font-medium hover:underline">
            ← {t("auth.signIn")}
          </button>
        </div>
      )}

    </div>
  );
}
