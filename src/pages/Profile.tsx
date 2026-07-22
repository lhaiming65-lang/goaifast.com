import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ArrowLeft, Mail, UserCircle, Save, LogOut, Package, Calendar } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLocale } from "@/i18n/locale";

interface ProfileRow {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export default function Profile() {
  const { t } = useTranslation();
  const { formatDateTime, isRTL } = useLocale();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (error) {
        toast.error(error.message);
      } else if (data) {
        setProfile(data as ProfileRow);
        setFullName(data.full_name ?? "");
        setAvatarUrl(data.avatar_url ?? "");
      }
      setLoading(false);
    })();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName || null, avatar_url: avatarUrl || null })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t("profile.saved", "个人资料已更新"));
      setProfile((p) => (p ? { ...p, full_name: fullName, avatar_url: avatarUrl } : p));
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success(t("auth.signOutSuccess"));
    navigate("/");
  };

  const initial = (fullName || user?.email || "U")[0]?.toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950" dir={isRTL ? "rtl" : "ltr"}>
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 py-4">
        <div className="container mx-auto px-4 flex items-center">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground me-6">
            <ArrowLeft className="w-4 h-4" />
            {t("auth.backHome")}
          </Link>
          <div className="flex-1" />
          <LanguageSwitcher />
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 max-w-3xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-brand flex items-center justify-center">
            <UserCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold">
              {t("profile.title", "个人资料")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("profile.subtitle", "查看并更新您的账户信息")}
            </p>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-sm p-6 md:p-8 mb-6">
          <div className="flex items-center gap-4 mb-8">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={fullName || "avatar"}
                className="w-20 h-20 rounded-full object-cover border-2 border-border"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-brand flex items-center justify-center text-white text-2xl font-bold">
                {initial}
              </div>
            )}
            <div className="min-w-0">
              <div className="font-bold text-lg truncate">{fullName || t("profile.noName", "未设置昵称")}</div>
              <div className="text-sm text-muted-foreground truncate flex items-center gap-1" dir="ltr">
                <Mail className="w-3.5 h-3.5 shrink-0" />
                {user?.email}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              {t("profile.loading", "加载中...")}
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <Label htmlFor="email">{t("auth.email")}</Label>
                <Input id="email" value={user?.email ?? ""} disabled dir="ltr" className="mt-1.5" />
                <p className="text-xs text-muted-foreground mt-1">
                  {t("profile.emailReadOnly", "邮箱由认证方式决定，暂不可修改")}
                </p>
              </div>
              <div>
                <Label htmlFor="fullName">{t("auth.fullName")}</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t("auth.fullNamePlaceholder")}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="avatar">{t("profile.avatarUrl", "头像链接")}</Label>
                <Input
                  id="avatar"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://..."
                  dir="ltr"
                  className="mt-1.5"
                />
              </div>

              {profile && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border text-sm">
                  <div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {t("profile.joinedAt", "注册时间")}
                    </div>
                    <div className="font-medium">{formatDateTime(profile.created_at)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {t("profile.updatedAt", "最近更新")}
                    </div>
                    <div className="font-medium">{formatDateTime(profile.updated_at)}</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex-1 h-12 rounded-xl bg-gradient-brand hover:opacity-90 text-white font-bold gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? t("profile.saving", "保存中...") : t("profile.save", "保存修改")}
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/orders")}
            className="flex-1 h-12 rounded-xl gap-2"
          >
            <Package className="w-4 h-4" />
            {t("auth.myOrders")}
          </Button>
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className="sm:w-auto h-12 rounded-xl text-destructive hover:text-destructive gap-2"
          >
            <LogOut className="w-4 h-4" />
            {t("auth.signOut")}
          </Button>
        </div>
      </main>
    </div>
  );
}
