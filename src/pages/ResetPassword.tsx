import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Lock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;
    const check = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (active) {
          setReady(!error && !!data.user);
          setChecking(false);
        }
      } catch {
        if (active) setChecking(false);
      }
    };
    check();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(true);
        setChecking(false);
      }
      if (event === "SIGNED_OUT") setReady(false);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    if (!ready) return;
    const pwdParsed = z
      .string()
      .min(8, { message: "新密码至少需要 8 个字符" })
      .max(72)
      .safeParse(password);
    if (!pwdParsed.success) {
      setErrorMessage(pwdParsed.error.issues[0].message);
      return;
    }
    if (password !== confirm) {
      setErrorMessage(t("auth.passwordMismatch"));
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: pwdParsed.data,
      });
      if (error) throw error;
      setPassword("");
      setConfirm("");
      const { error: signOutError } = await supabase.auth.signOut();
      toast.success(t("auth.passwordUpdated"));
      if (signOutError) {
        setErrorMessage(
          "密码已更新，但退出登录失败，请前往账户中心退出所有设备。",
        );
        return;
      }
      navigate("/auth", { replace: true });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "密码更新失败，请重试",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background flex flex-col">
      <header className="p-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("auth.backHome")}
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-card rounded-3xl shadow-soft border border-border p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold bg-gradient-brand bg-clip-text text-transparent">
              {t("auth.resetPasswordTitle")}
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              {t("auth.resetPasswordSubtitle")}
            </p>
          </div>

          {errorMessage && (
            <p
              role="alert"
              className="mb-4 rounded-lg bg-destructive/5 p-3 text-sm text-destructive"
            >
              {errorMessage}
            </p>
          )}
          {checking ? (
            <p className="text-center text-sm text-muted-foreground">
              正在验证重置链接…
            </p>
          ) : !ready ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                重置链接无效或已过期，请重新发送密码重置邮件。
              </p>
              <Button asChild variant="outline">
                <Link to="/auth?mode=forgot">重新获取重置链接</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">{t("auth.newPassword")}</Label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    id="new-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-11"
                    minLength={8}
                    maxLength={72}
                    required
                    autoComplete="new-password"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">{t("auth.confirmPassword")}</Label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    id="confirm"
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="pl-10 h-11"
                    minLength={8}
                    maxLength={72}
                    required
                    autoComplete="new-password"
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full h-11 rounded-xl bg-gradient-brand hover:opacity-90 text-white font-medium"
                disabled={loading}
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {t("auth.updatePassword")}
              </Button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
