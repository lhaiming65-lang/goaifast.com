import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
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
  redirectTo?: string;
}

export default function AuthForm({
  initialMode = "signin",
  onSuccess,
  compact = false,
  redirectTo = "/profile",
}: Props) {
  const { t } = useTranslation();
  // Auth page's useEffect + modal onSuccess handle redirect/close after session updates
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [consent, setConsent] = useState(false);
  const [notice, setNotice] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendAfter, setResendAfter] = useState(0);
  useEffect(() => setMode(initialMode), [initialMode]);
  const safePath =
    redirectTo.startsWith("/") &&
    !redirectTo.startsWith("//") &&
    !redirectTo.includes("\\")
      ? redirectTo
      : "/profile";
  const authRedirect = `${window.location.origin}/auth?next=${encodeURIComponent(safePath)}`;

  const emailSchema = z
    .string()
    .trim()
    .email({ message: t("auth.invalidEmail") })
    .max(255);
  const passwordSchema = z
    .string()
    .min(mode === "signup" ? 8 : 1, { message: "新密码至少需要 8 个字符" })
    .max(72);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setErrorMessage("");
    const emailParsed = emailSchema.safeParse(email);
    if (!emailParsed.success) {
      setErrorMessage(emailParsed.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(
          emailParsed.data,
          {
            redirectTo: `${window.location.origin}/reset-password`,
          },
        );
        if (error) throw error;
        setNotice(
          "如果此邮箱已注册，你将收到重置密码邮件。请检查收件箱和垃圾邮件文件夹。",
        );
        setMode("signin");
      } else if (mode === "signin") {
        const pwdParsed = passwordSchema.safeParse(password);
        if (!pwdParsed.success) {
          setErrorMessage(pwdParsed.error.issues[0].message);
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
          setErrorMessage(pwdParsed.error.issues[0].message);
          setLoading(false);
          return;
        }
        if (password !== confirm) {
          setErrorMessage(t("auth.passwordMismatch"));
          setLoading(false);
          return;
        }
        if (!consent) throw new Error("请阅读并同意服务条款与隐私政策");
        const { data, error } = await supabase.auth.signUp({
          email: emailParsed.data,
          password: pwdParsed.data,
          options: {
            emailRedirectTo: authRedirect,
            data: {
              full_name: fullName.trim() || null,
              terms_accepted_at: new Date().toISOString(),
            },
          },
        });
        if (error) throw error;
        if (data.session) {
          toast.success("注册成功");
          onSuccess?.();
        } else
          setNotice(
            "注册申请已提交。请打开邮箱中的确认链接，验证成功后即可继续购物。",
          );
        setPassword("");
        setConfirm("");
        setMode("signin");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const resendConfirmation = async () => {
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setErrorMessage("请先填写需要验证的邮箱");
      return;
    }
    if (Date.now() < resendAfter) {
      setErrorMessage("验证邮件已发送，请稍等一分钟后重试");
      return;
    }
    setResendLoading(true);
    setErrorMessage("");
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: parsed.data,
        options: { emailRedirectTo: authRedirect },
      });
      if (error) throw error;
      setResendAfter(Date.now() + 60_000);
      setNotice("验证邮件已发送。请检查收件箱和垃圾邮件文件夹。");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "邮件发送失败，请稍后再试",
      );
    } finally {
      setResendLoading(false);
    }
  };

  const title =
    mode === "signin"
      ? t("auth.welcomeBack")
      : mode === "signup"
        ? t("auth.createAccount")
        : t("auth.forgotPasswordTitle");

  const subtitle =
    mode === "signin"
      ? t("auth.signInSubtitle")
      : mode === "signup"
        ? t("auth.signUpSubtitle")
        : t("auth.forgotPasswordSubtitle");

  return (
    <div className={compact ? "" : "w-full max-w-md"}>
      <div className="text-center mb-5">
        <h1 className="text-2xl font-bold bg-gradient-brand bg-clip-text text-transparent">
          {title}
        </h1>
        <p className="text-sm text-muted-foreground mt-1.5">{subtitle}</p>
      </div>

      {mode !== "forgot" && (
        <>
          <div className="grid grid-cols-2 gap-1 p-1 mb-5 rounded-xl bg-secondary/60 border border-border">
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setMode("signin");
                setErrorMessage("");
              }}
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
              disabled={loading}
              onClick={() => {
                setMode("signup");
                setErrorMessage("");
              }}
              className={`h-9 rounded-lg text-sm font-medium transition-all ${
                mode === "signup"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("auth.signUp")}
            </button>
          </div>

          {mode === "signin" && (
            <>
              <SocialAuthButtons redirectTo={authRedirect} />
              <p className="mt-3 text-center text-xs leading-relaxed text-muted-foreground">
                继续登录即表示同意{" "}
                <Link
                  to="/page/terms"
                  target="_blank"
                  className="text-primary hover:underline"
                >
                  服务条款
                </Link>{" "}
                与{" "}
                <Link
                  to="/page/privacy"
                  target="_blank"
                  className="text-primary hover:underline"
                >
                  隐私政策
                </Link>
                。
              </p>
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-3 text-muted-foreground">
                    {t("auth.orContinueWith")}
                  </span>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {notice && (
        <div
          role="status"
          className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900"
        >
          {notice}
        </div>
      )}
      {errorMessage && (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive"
        >
          {errorMessage}
        </div>
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
                autoComplete="name"
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
                minLength={mode === "signup" ? 8 : 1}
                maxLength={72}
                autoComplete={
                  mode === "signin" ? "current-password" : "new-password"
                }
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
                minLength={8}
                maxLength={72}
                autoComplete="new-password"
              />
            </div>
          </div>
        )}

        {mode === "signup" && (
          <label className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
            <input
              type="checkbox"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
              required
              className="mt-1 accent-primary"
            />
            <span>
              我已阅读并同意{" "}
              <Link
                to="/page/terms"
                target="_blank"
                className="text-primary hover:underline"
              >
                服务条款
              </Link>{" "}
              和{" "}
              <Link
                to="/page/privacy"
                target="_blank"
                className="text-primary hover:underline"
              >
                隐私政策
              </Link>
              。新密码至少 8 位，建议同时包含字母、数字和符号。
            </span>
          </label>
        )}
        <Button
          type="submit"
          className="w-full h-11 rounded-xl bg-gradient-brand hover:opacity-90 transition-opacity text-white font-medium"
          disabled={loading}
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          {mode === "signin"
            ? loading
              ? t("auth.signingIn")
              : t("auth.signIn")
            : mode === "signup"
              ? loading
                ? t("auth.signingUp")
                : t("auth.signUp")
              : t("auth.sendResetLink")}
        </Button>

        {mode === "signin" && (
          <button
            type="button"
            onClick={resendConfirmation}
            disabled={resendLoading || loading}
            className="w-full text-xs text-muted-foreground hover:text-primary disabled:opacity-50"
          >
            {resendLoading ? "发送中…" : "没有收到验证邮件？重新发送"}
          </button>
        )}
      </form>

      {mode === "forgot" && (
        <div className="mt-6 text-center text-sm">
          <button
            onClick={() => setMode("signin")}
            className="text-primary font-medium hover:underline"
          >
            ← {t("auth.signIn")}
          </button>
        </div>
      )}
    </div>
  );
}
