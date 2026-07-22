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

  useEffect(() => {
    // Supabase recovery link creates a session with type=recovery in URL hash.
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      setReady(!!data.session);
    };
    check();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pwdParsed = z.string().min(6, { message: t("auth.passwordTooShort") }).max(72).safeParse(password);
    if (!pwdParsed.success) {
      toast.error(pwdParsed.error.issues[0].message);
      return;
    }
    if (password !== confirm) {
      toast.error(t("auth.passwordMismatch"));
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pwdParsed.data });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t("auth.passwordUpdated"));
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background flex flex-col">
      <header className="p-4">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
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
            <p className="text-sm text-muted-foreground mt-2">{t("auth.resetPasswordSubtitle")}</p>
          </div>

          {!ready ? (
            <p className="text-center text-sm text-muted-foreground">Loading…</p>
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
                    minLength={6}
                    maxLength={72}
                    required
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
                    minLength={6}
                    maxLength={72}
                    required
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
